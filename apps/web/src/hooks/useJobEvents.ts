import { useState, useEffect, useRef } from "react"
import { listenForJobEvents, fetchJobStatus } from "~web/lib/api-client.ts"

import type { SseDiscoveredStory } from "@weric/ui"

export interface JobState {
  active: boolean
  progress: number
  message: string
  stories: SseDiscoveredStory[]
  status: "idle" | "running" | "completed" | "failed"
}

const MAX_RECONNECT_ATTEMPTS = 10
const RECONNECT_DELAY_MS = 2000
const LATE_STATUS_CHECK_MS = 3000

export function useJobEvents(jobId: string | null) {
  const [state, setState] = useState<JobState>({
    active: false,
    progress: 0,
    message: "",
    stories: [],
    status: "idle",
  })

  const statusRef = useRef(state.status)
  statusRef.current = state.status

  const reconnectRef = useRef<{
    timer: ReturnType<typeof setTimeout> | null
    attempts: number
  }>({ timer: null, attempts: 0 })

  useEffect(() => {
    if (!jobId) return

    statusRef.current = "running"

    setState({
      active: true,
      progress: 0,
      message: "Starting discovery...",
      stories: [],
      status: "running",
    })

    let disposed = false
    let cleanupCurrent: (() => void) | null = null
    let lateCheckTimer: ReturnType<typeof setTimeout> | null = null

    const stopReconnect = () => {
      if (reconnectRef.current.timer) {
        clearTimeout(reconnectRef.current.timer)
        reconnectRef.current.timer = null
      }
    }

    const clearLateCheck = () => {
      if (lateCheckTimer) {
        clearTimeout(lateCheckTimer)
        lateCheckTimer = null
      }
    }

    const applyTerminal = (status: "completed" | "failed") => {
      statusRef.current = status
      stopReconnect()
      clearLateCheck()
      cleanupCurrent?.()
      cleanupCurrent = null
      setState(prev => ({
        ...prev,
        active: false,
        progress: status === "completed" ? 1 : prev.progress,
        message:
          status === "completed" ? "Discovery complete" : "Discovery failed",
        status,
      }))
    }

    const openStream = () => {
      if (disposed) return
      stopReconnect()
      clearLateCheck()

      cleanupCurrent = listenForJobEvents(jobId, {
        onProgress: data => {
          reconnectRef.current.attempts = 0
          setState(prev => ({
            ...prev,
            progress: data.progress,
            message: data.message,
            stories: data.stories
              ? [...prev.stories, ...data.stories]
              : prev.stories,
          }))
        },
        onStatus: data => {
          reconnectRef.current.attempts = 0
          if (data.status === "completed" || data.status === "failed") {
            statusRef.current = data.status
            stopReconnect()
            clearLateCheck()
          }
          if (data.status === "completed") {
            setState(prev => ({
              ...prev,
              active: false,
              progress: 1,
              message: "Discovery complete",
              status: "completed",
            }))
          } else if (data.status === "failed") {
            setState(prev => ({
              ...prev,
              active: false,
              message: "Discovery failed",
              status: "failed",
            }))
          }
        },
        onError: () => {
          if (disposed) return
          clearLateCheck()
          if (
            statusRef.current === "completed" ||
            statusRef.current === "failed"
          ) {
            return
          }
          setState(prev => ({
            ...prev,
            active: true,
          }))
          if (reconnectRef.current.attempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectRef.current.attempts += 1
            reconnectRef.current.timer = setTimeout(() => {
              reconnectRef.current.timer = null
              connect()
            }, RECONNECT_DELAY_MS)
          }
        },
      })

      // Close the race where the job finished between the status check and
      // the SSE registration, so its completion event was already missed.
      lateCheckTimer = setTimeout(() => {
        lateCheckTimer = null
        fetchJobStatus(jobId).then(status => {
          if (disposed) return
          if (status === "completed" || status === "failed") {
            applyTerminal(status)
          }
        })
      }, LATE_STATUS_CHECK_MS)
    }

    const connect = () => {
      if (disposed) return
      stopReconnect()
      clearLateCheck()

      // Fast path: if the job already reached a terminal state, there will be
      // no further SSE events, so apply it directly and skip the stream.
      fetchJobStatus(jobId).then(status => {
        if (disposed) return
        if (status === "completed" || status === "failed") {
          applyTerminal(status)
          return
        }
        openStream()
      })
    }

    connect()

    return () => {
      disposed = true
      stopReconnect()
      clearLateCheck()
      cleanupCurrent?.()
    }
  }, [jobId])

  return state
}
