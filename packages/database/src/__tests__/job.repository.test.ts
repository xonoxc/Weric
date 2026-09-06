import { describe, expect, it, beforeEach } from "vitest"
import { Effect, Layer, Option } from "effect"
import {
  JobRepository,
  JobRepositoryLive,
} from "~db/repositories/job.repository.ts"
import { getTestDb, cleanDatabase } from "~db/__tests__/helpers.ts"
import type { JobRepositoryShape } from "~db/repositories/job.repository.ts"

import { Database } from "~db/connection.ts"
import type { Db } from "~db/connection.ts"

describe("JobRepository", () => {
  let repo: JobRepositoryShape

  beforeEach(async () => {
    await cleanDatabase()
    const db: Db = getTestDb()
    const DatabaseLayer = Layer.succeed(Database, db)
    repo = Effect.runSync(
      Effect.gen(function* () {
        return yield* JobRepository
      }).pipe(
        Effect.provide(JobRepositoryLive.pipe(Layer.provide(DatabaseLayer)))
      )
    )
  })

  it("creates a job", async () => {
    const job = await Effect.runPromise(
      repo.create({
        type: "discover_stories",
        payload: Option.none(),
        scheduledAt: Option.none(),
      })
    )
    expect(job.type).toBe("discover_stories")
    expect(job.status).toBe("pending")
    expect(job.retries).toBe(0)
  })

  it("creates a job with payload", async () => {
    const job = await Effect.runPromise(
      repo.create({
        type: "refresh_story",
        payload: Option.some({ url: "https://example.com" }),
        scheduledAt: Option.none(),
      })
    )
    expect(job.payload).toEqual({ url: "https://example.com" })
  })

  it("creates a scheduled job", async () => {
    const future = new Date(Date.now() + 3600000)
    const job = await Effect.runPromise(
      repo.create({
        type: "cleanup_evidence",
        payload: Option.none(),
        scheduledAt: Option.some(future),
      })
    )
    expect(job.scheduledAt).toBeInstanceOf(Date)
  })

  it("finds pending jobs", async () => {
    await Effect.runPromise(
      repo.create({
        type: "discover_stories",
        payload: Option.none(),
        scheduledAt: Option.none(),
      })
    )
    await Effect.runPromise(
      repo.create({
        type: "search_discover",
        payload: Option.none(),
        scheduledAt: Option.none(),
      })
    )

    const pending = await Effect.runPromise(repo.findPending())
    expect(pending.length).toBe(2)
  })

  it("does not return running jobs as pending", async () => {
    const job = await Effect.runPromise(
      repo.create({
        type: "refresh_story",
        payload: Option.none(),
        scheduledAt: Option.none(),
      })
    )
    await Effect.runPromise(repo.updateStatus(job.id, "running"))

    const pending = await Effect.runPromise(repo.findPending())
    const match = pending.find(j => j.id === job.id)
    expect(match).toBeUndefined()
  })

  it("updates job status", async () => {
    const job = await Effect.runPromise(
      repo.create({
        type: "rebuild_recommendations",
        payload: Option.none(),
        scheduledAt: Option.none(),
      })
    )
    await Effect.runPromise(repo.updateStatus(job.id, "completed"))

    const pending = await Effect.runPromise(repo.findPending())
    const match = pending.find(j => j.id === job.id)
    expect(match).toBeUndefined()
  })

  it("increments retries without error", async () => {
    const job = await Effect.runPromise(
      repo.create({
        type: "learn_interests",
        payload: Option.none(),
        scheduledAt: Option.none(),
      })
    )
    await Effect.runPromise(repo.incrementRetries(job.id))
  })
})
