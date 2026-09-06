import { describe, expect, it, beforeEach } from "@effect/vitest"
import { Effect, Layer, Option } from "effect"
import {
  EvidenceRepository,
  EvidenceRepositoryLive,
} from "~db/repositories/evidence.repository.ts"
import { getTestDb, cleanDatabase } from "~db/__tests__/helpers.ts"

import { Database } from "~db/connection.ts"

const NON_EXISTENT_ID = "00000000-0000-0000-0000-000000000000"

const databaseLayer = Layer.effect(
  Database,
  Effect.sync(() => getTestDb())
)
const evidenceRepoLayer = Layer.mergeAll(
  databaseLayer,
  EvidenceRepositoryLive.pipe(Layer.provide(databaseLayer))
)

describe("EvidenceRepository", () => {
  beforeEach(() => cleanDatabase())

  it.effect("creates an evidence record", () =>
    Effect.gen(function* () {
      const repo = yield* EvidenceRepository

      const ev = yield* repo.create({
        source: "news",
        url: "https://example.com/article",
        title: "Test Article",
        content: "Article content here",
      })

      expect(ev.title).toBe("Test Article")
      expect(ev.url).toBe("https://example.com/article")

      expect(ev.source).toBe("news")
      expect(ev.id).toBeDefined()
    }).pipe(Effect.provide(evidenceRepoLayer))
  )

  it.effect("creates evidence with metadata", () =>
    Effect.gen(function* () {
      const repo = yield* EvidenceRepository

      const ev = yield* repo.create({
        source: "news",
        url: "https://example.com/meta",
        title: "With Meta",
        content: "Content",
        metadata: { category: "tech", tags: ["ai"] },
      })

      expect(ev.metadata).toEqual({ category: "tech", tags: ["ai"] })
    }).pipe(Effect.provide(evidenceRepoLayer))
  )

  it.effect("throws ConflictError when url already exists", () =>
    Effect.gen(function* () {
      const repo = yield* EvidenceRepository
      yield* repo.create({
        source: "news",
        url: "https://example.com/dup",
        title: "First",
        content: "First content",
      })

      const error = yield* repo
        .create({
          source: "blog",
          url: "https://example.com/dup",
          title: "Second",
          content: "Second content",
        })
        .pipe(Effect.flip)

      expect(error._tag).toBe("ConflictError")
    }).pipe(Effect.provide(evidenceRepoLayer))
  )

  it.effect("finds evidence by id", () =>
    Effect.gen(function* () {
      const repo = yield* EvidenceRepository

      const created = yield* repo.create({
        source: "news",
        url: "https://example.com/find",
        title: "Find Me",
        content: "Content",
      })

      const found = yield* repo.findById(created.id)

      expect(Option.isSome(found)).toBe(true)
      expect(Option.getOrThrow(found).id).toBe(created.id)
    }).pipe(Effect.provide(evidenceRepoLayer))
  )

  it.effect("returns none when evidence not found by id", () =>
    Effect.gen(function* () {
      const repo = yield* EvidenceRepository

      const result = yield* repo.findById(NON_EXISTENT_ID)

      expect(Option.isNone(result)).toBe(true)
    }).pipe(Effect.provide(evidenceRepoLayer))
  )

  it.effect("finds evidence by url", () =>
    Effect.gen(function* () {
      const repo = yield* EvidenceRepository
      const url = "https://example.com/by-url"

      yield* repo.create({
        source: "news",
        url,
        title: "By URL",
        content: "Content",
      })

      const found = yield* repo.findByUrl(url)

      expect(Option.isSome(found)).toBe(true)
      expect(Option.getOrThrow(found).url).toBe(url)
    }).pipe(Effect.provide(evidenceRepoLayer))
  )

  it.effect("finds evidence by source", () =>
    Effect.gen(function* () {
      const repo = yield* EvidenceRepository

      yield* repo.create({
        source: "twitter",
        url: "https://twitter.com/1",
        title: "Tweet 1",
        content: "Content 1",
      })

      yield* repo.create({
        source: "twitter",
        url: "https://twitter.com/2",
        title: "Tweet 2",
        content: "Content 2",
      })

      const results = yield* repo.findBySource("twitter")

      expect(results.length).toBe(2)
    }).pipe(Effect.provide(evidenceRepoLayer))
  )

  it.effect("finds evidence with pagination", () =>
    Effect.gen(function* () {
      const repo = yield* EvidenceRepository

      yield* repo.create({
        source: "news",
        url: "https://example.com/p1",
        title: "Page 1",
        content: "Content",
      })

      yield* repo.create({
        source: "news",
        url: "https://example.com/p2",
        title: "Page 2",
        content: "Content",
      })

      yield* repo.create({
        source: "news",
        url: "https://example.com/p3",
        title: "Page 3",
        content: "Content",
      })

      const result = yield* repo.findMany({ page: 1, limit: 2 })

      expect(result.data.length).toBe(2)
      expect(result.total).toBe(3)
    }).pipe(Effect.provide(evidenceRepoLayer))
  )
})
