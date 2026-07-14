import { Effect } from "effect"
import { JobRepository } from "@weric/database"

export interface JobHandler {
  type: string
  handle: (
    payload: Record<string, unknown>,
    jobId: string
  ) => Effect.Effect<void, Error>
}

interface PendingJob {
  id: string
  type: string
  payload: unknown
}

export class WorkerRuntime {
  private running = false
  private activeJobs = 0
  private jobQueue: PendingJob[] = []
  private abortController: AbortController | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(
    private readonly jobRepo: JobRepository,
    private readonly handlers: JobHandler[],
    private readonly options: {
      apiUrl?: string
      maxConcurrency?: number
    } = {}
  ) {}

  start(): void {
    this.running = true
    this.connectToApi()

    process.on("SIGTERM", () => this.shutdown())
    process.on("SIGINT", () => this.shutdown())

    console.log(
      `[Worker] Runtime started (max concurrency: ${this.options.maxConcurrency ?? 3})`
    )
  }

  shutdown(): void {
    if (!this.running) return
    this.running = false
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.abortController?.abort()
    console.log("[Worker] Shutting down...")
  }

  private async connectToApi(): Promise<void> {
    const apiUrl = this.options.apiUrl ?? "http://localhost:3000"
    this.abortController = new AbortController()

    const connect = async () => {
      try {
        const response = await fetch(`${apiUrl}/internal/worker/events`, {
          signal: this.abortController!.signal,
        })

        if (!response.ok || !response.body) {
          throw new Error(`SSE connection failed: ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (this.running) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          const parts = buffer.split("\n\n")
          buffer = parts.pop() ?? ""

          for (const part of parts) {
            if (!part.trim()) continue

            let eventType = "message"
            let data = ""

            for (const line of part.split("\n")) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7).trim()
              } else if (line.startsWith("data: ")) {
                data = line.slice(6)
              }
            }

            if (data) {
              try {
                const parsed = JSON.parse(data)
                if (eventType === "init") {
                  this.handleInit(parsed)
                } else if (eventType === "new_job") {
                  this.handleNewJob(parsed)
                }
              } catch {
                // malformed JSON, skip
              }
            }
          }
        }
      } catch {
        // connection lost or aborted
      }

      if (this.running) {
        console.log("[Worker] SSE connection lost, reconnecting in 2s...")
        this.reconnectTimer = setTimeout(() => this.connectToApi(), 2000)
      }
    }

    console.log(
      `[Worker] Connecting to API at ${apiUrl}/internal/worker/events...`
    )
    connect()
  }

  private handleInit(jobs: PendingJob[]): void {
    console.log(`[Worker] Received ${jobs.length} pending job(s) via init`)
    for (const job of jobs) {
      this.enqueueJob(job)
    }
  }

  private handleNewJob(job: PendingJob): void {
    console.log(`[Worker] Received new job ${job.id} (${job.type})`)
    this.enqueueJob(job)
  }

  private enqueueJob(job: PendingJob): void {
    const max = this.options.maxConcurrency ?? 3
    if (this.activeJobs < max) {
      this.executeJob(job)
    } else {
      this.jobQueue.push(job)
    }
  }

  private processQueue(): void {
    const max = this.options.maxConcurrency ?? 3
    while (this.activeJobs < max && this.jobQueue.length > 0) {
      const job = this.jobQueue.shift()!
      this.executeJob(job)
    }
  }

  private executeJob(job: PendingJob): void {
    const handler = this.handlers.find(h => h.type === job.type)
    if (!handler) {
      console.warn(`[Worker] No handler for job type: ${job.type}`)
      Effect.runPromise(this.jobRepo.updateStatus(job.id, "failed")).catch(
        () => {}
      )
      return
    }

    this.activeJobs++
    console.log(`[Worker] Starting job ${job.id} (${job.type})`)

    const payload = (job.payload ?? {}) as Record<string, unknown>

    const run = async () => {
      await Effect.runPromise(this.jobRepo.updateStatus(job.id, "running"))
      await Effect.runPromise(handler.handle(payload, job.id))
      await Effect.runPromise(this.jobRepo.updateStatus(job.id, "completed"))
    }

    run()
      .then(() => {
        this.activeJobs--
        console.log(`[Worker] Job ${job.id} (${job.type}) completed`)
        this.processQueue()
      })
      .catch((error: unknown) => {
        this.activeJobs--
        console.error(`[Worker] Job ${job.id} (${job.type}) failed:`, error)
        Effect.runPromise(this.jobRepo.updateStatus(job.id, "failed")).catch(
          () => {}
        )
        this.processQueue()
      })
  }
}
