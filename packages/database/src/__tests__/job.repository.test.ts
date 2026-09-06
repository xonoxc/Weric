import { describe, expect, it, beforeEach } from "@effect/vitest"
import { Effect, Layer, Option } from "effect"
import {
  JobRepository,
  JobRepositoryLive,
} from "~db/repositories/job.repository.ts"
import { getTestDb, cleanDatabase } from "~db/__tests__/helpers.ts"

import { Database } from "~db/connection.ts"

const databaseLayer = Layer.effect(
  Database,
  Effect.sync(() => getTestDb())
)

const jobRepoLayer = Layer.mergeAll(
  databaseLayer,
  JobRepositoryLive.pipe(Layer.provide(databaseLayer))
)

describe("JobRepository", () => {
  beforeEach(() => cleanDatabase())

  it.effect("creates a job", () =>
    Effect.gen(function* () {
      const repo = yield* JobRepository

      const job = yield* repo.create({
        type: "discover_stories",
        payload: Option.none(),
        scheduledAt: Option.none(),
      })
      expect(job.type).toBe("discover_stories")

      expect(job.status).toBe("pending")
      expect(job.retries).toBe(0)
    }).pipe(Effect.provide(jobRepoLayer))
  )

  it.effect("creates a job with payload", () =>
    Effect.gen(function* () {
      const repo = yield* JobRepository

      const job = yield* repo.create({
        type: "refresh_story",
        payload: Option.some({ url: "https://example.com" }),
        scheduledAt: Option.none(),
      })

      expect(job.payload).toEqual({ url: "https://example.com" })
    }).pipe(Effect.provide(jobRepoLayer))
  )

  it.effect("creates a scheduled job", () =>
    Effect.gen(function* () {
      const repo = yield* JobRepository

      const future = new Date(Date.now() + 3600000)

      const job = yield* repo.create({
        type: "cleanup_evidence",
        payload: Option.none(),
        scheduledAt: Option.some(future),
      })

      expect(job.scheduledAt).toBeInstanceOf(Date)
    }).pipe(Effect.provide(jobRepoLayer))
  )

  it.effect("finds pending jobs", () =>
    Effect.gen(function* () {
      const repo = yield* JobRepository

      yield* repo.create({
        type: "discover_stories",
        payload: Option.none(),
        scheduledAt: Option.none(),
      })
      yield* repo.create({
        type: "search_discover",
        payload: Option.none(),
        scheduledAt: Option.none(),
      })

      const pending = yield* repo.findPending()

      expect(pending.length).toBe(2)
    }).pipe(Effect.provide(jobRepoLayer))
  )

  it.effect("does not return running jobs as pending", () =>
    Effect.gen(function* () {
      const repo = yield* JobRepository

      const job = yield* repo.create({
        type: "refresh_story",
        payload: Option.none(),
        scheduledAt: Option.none(),
      })

      yield* repo.updateStatus(job.id, "running")

      const pending = yield* repo.findPending()

      const match = pending.find(j => j.id === job.id)
      expect(match).toBeUndefined()
    }).pipe(Effect.provide(jobRepoLayer))
  )

  it.effect("updates job status", () =>
    Effect.gen(function* () {
      const repo = yield* JobRepository

      const job = yield* repo.create({
        type: "rebuild_recommendations",
        payload: Option.none(),
        scheduledAt: Option.none(),
      })

      yield* repo.updateStatus(job.id, "completed")

      const pending = yield* repo.findPending()

      const match = pending.find(j => j.id === job.id)
      expect(match).toBeUndefined()
    }).pipe(Effect.provide(jobRepoLayer))
  )

  it.effect("increments retries without error", () =>
    Effect.gen(function* () {
      const repo = yield* JobRepository

      const job = yield* repo.create({
        type: "learn_interests",
        payload: Option.none(),
        scheduledAt: Option.none(),
      })

      yield* repo.incrementRetries(job.id)
    }).pipe(Effect.provide(jobRepoLayer))
  )
})
