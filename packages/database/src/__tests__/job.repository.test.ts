import { describe, expect, it, beforeEach } from "vitest"
import { Effect } from "effect"
import { JobRepository } from "~/repositories/job.repository.ts"
import { getTestDb, cleanDatabase } from "~/__tests__/helpers.ts"
import type { Db } from "~/connection.ts"

describe("JobRepository", () => {
  let repo: JobRepository

  beforeEach(async () => {
    await cleanDatabase()
    const db: Db = getTestDb()
    repo = new JobRepository(db)
  })

  it("creates a job", async () => {
    const job = await Effect.runPromise(repo.create({ type: "scrape" }))
    expect(job.type).toBe("scrape")
    expect(job.status).toBe("pending")
    expect(job.retries).toBe(0)
  })

  it("creates a job with payload", async () => {
    const job = await Effect.runPromise(
      repo.create({ type: "process", payload: { url: "https://example.com" } })
    )
    expect(job.payload).toEqual({ url: "https://example.com" })
  })

  it("creates a scheduled job", async () => {
    const future = new Date(Date.now() + 3600000)
    const job = await Effect.runPromise(
      repo.create({ type: "scheduled-task", scheduledAt: future })
    )
    expect(job.scheduledAt).toBeInstanceOf(Date)
  })

  it("finds pending jobs", async () => {
    await Effect.runPromise(repo.create({ type: "job-a" }))
    await Effect.runPromise(repo.create({ type: "job-b" }))

    const pending = await Effect.runPromise(repo.findPending())
    expect(pending.length).toBe(2)
  })

  it("does not return running jobs as pending", async () => {
    const job = await Effect.runPromise(repo.create({ type: "already-running" }))
    await Effect.runPromise(repo.updateStatus(job.id, "running"))

    const pending = await Effect.runPromise(repo.findPending())
    const match = pending.find(j => j.id === job.id)
    expect(match).toBeUndefined()
  })

  it("updates job status", async () => {
    const job = await Effect.runPromise(repo.create({ type: "status-test" }))
    await Effect.runPromise(repo.updateStatus(job.id, "completed"))

    const pending = await Effect.runPromise(repo.findPending())
    const match = pending.find(j => j.id === job.id)
    expect(match).toBeUndefined()
  })

  it("increments retries without error", async () => {
    const job = await Effect.runPromise(repo.create({ type: "retry-test" }))
    await Effect.runPromise(repo.incrementRetries(job.id))
  })
})
