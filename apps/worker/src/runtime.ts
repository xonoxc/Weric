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
  retries: number
}

export class WorkerRuntime {
  private running = false
  private activeJobs = 0
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly jobRepo: JobRepository,
    private readonly handlers: JobHandler[],
    private readonly options: {
      pollIntervalMs?: number
      maxConcurrency?: number
    } = {}
  ) {}

  start(): void {
    this.running = true
    const interval = this.options.pollIntervalMs ?? 5_000
    this.timer = setInterval(() => this.poll(), interval)
    this.poll()

    process.on("SIGTERM", () => this.shutdown())
    process.on("SIGINT", () => this.shutdown())

    console.log(`Worker runtime started (poll every ${interval}ms)`)
  }

  shutdown(): void {
    if (!this.running) return
    this.running = false
    if (this.timer) clearInterval(this.timer)
    console.log("Worker shutting down...")
  }

  private poll(): void {
    if (!this.running) return

    const max = this.options.maxConcurrency ?? 3
    if (this.activeJobs >= max) return

    Effect.runPromise(this.jobRepo.findPending()).then(
      (jobs: PendingJob[]) => {
        for (const job of jobs) {
          if (this.activeJobs >= max) break
          this.executeJob(job)
        }
      },
      (error: unknown) => {
        console.error("Failed to poll jobs:", error)
      }
    )
  }

  private executeJob(job: PendingJob): void {
    const handler = this.handlers.find(h => h.type === job.type)
    if (!handler) {
      console.warn(`No handler for job type: ${job.type}`)
      Effect.runPromise(this.jobRepo.updateStatus(job.id, "failed"))
      return
    }

    this.activeJobs++
    const repo = this.jobRepo
    const payload = (job.payload ?? {}) as Record<string, unknown>
    const finish = () => {
      this.activeJobs--
    }

    const run = async () => {
      await Effect.runPromise(repo.updateStatus(job.id, "running"))
      await Effect.runPromise(handler.handle(payload, job.id))
      await Effect.runPromise(repo.updateStatus(job.id, "completed"))
    }

    run()
      .then(finish)
      .catch((error: unknown) => {
        console.error(`Job ${job.id} (${job.type}) failed:`, error)
        Effect.runPromise(repo.updateStatus(job.id, "failed")).finally(finish)
      })
  }
}
