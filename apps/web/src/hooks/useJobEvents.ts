import { useState, useEffect } from "react"
import type { SseDiscoveredStory } from "@weric/ui"
import { listenForJobEvents } from "../lib/api-client.ts"

export interface JobState {
  active: boolean
  progress: number
  message: string
  stories: SseDiscoveredStory[]
  status: "idle" | "running" | "completed" | "failed"
}

export function useJobEvents(jobId: string | null) {
  const [state, setState] = useState<JobState>({
    active: false,
    progress: 0,
    message: "",
    stories: [],
    status: "idle",
  })

  useEffect(() => {
    if (!jobId) return

    setState({
      active: true,
      progress: 0,
      message: "Starting discovery...",
      stories: [],
      status: "running",
    })

    const cleanup = listenForJobEvents(jobId, {
      onProgress: data => {
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
        setState(prev => ({
          ...prev,
          active: false,
        }))
      },
    })

    return () => {
      cleanup()
    }
  }, [jobId])

  return state
}
