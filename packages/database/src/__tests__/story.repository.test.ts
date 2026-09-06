import { describe, expect, it, beforeEach } from "vitest"
import { Effect, Layer, Option } from "effect"
import {
  StoryRepository,
  StoryRepositoryLive,
} from "~db/repositories/story.repository.ts"
import { getTestDb, cleanDatabase } from "~db/__tests__/helpers.ts"
import type { StoryRepositoryShape } from "~db/repositories/story.repository.ts"

import { Database } from "~db/connection.ts"
import type { Db } from "~db/connection.ts"

const NON_EXISTENT_ID = "00000000-0000-0000-0000-000000000000"

describe("StoryRepository", () => {
  let repo: StoryRepositoryShape

  beforeEach(async () => {
    await cleanDatabase()
    const db: Db = getTestDb()
    const DatabaseLayer = Layer.succeed(Database, db)
    repo = Effect.runSync(
      Effect.gen(function* () {
        return yield* StoryRepository
      }).pipe(
        Effect.provide(StoryRepositoryLive.pipe(Layer.provide(DatabaseLayer)))
      )
    )
  })

  it("creates a story with basic fields", async () => {
    const story = await Effect.runPromise(
      repo.create({
        title: "Test Story",
        slug: "test-story",
        summary: Option.none(),
      })
    )
    expect(story.title).toBe("Test Story")
    expect(story.slug).toBe("test-story")
    expect(story.summary).toBeNull()
    expect(story.id).toBeDefined()
    expect(story.createdAt).toBeInstanceOf(Date)
  })

  it("creates a story with summary", async () => {
    const story = await Effect.runPromise(
      repo.create({
        title: "Test Story",
        slug: "test-story",
        summary: Option.some("A brief summary"),
      })
    )
    expect(story.summary).toBe("A brief summary")
  })

  it("finds a story by id", async () => {
    const created = await Effect.runPromise(
      repo.create({ title: "Test", slug: "test", summary: Option.none() })
    )
    const found = await Effect.runPromise(repo.findById(created.id))
    expect(Option.isSome(found)).toBe(true)
    expect(Option.getOrThrow(found).id).toBe(created.id)
  })

  it("returns none when story not found by id", async () => {
    const result = await Effect.runPromise(repo.findById(NON_EXISTENT_ID))
    expect(Option.isNone(result)).toBe(true)
  })

  it("finds a story by slug", async () => {
    await Effect.runPromise(
      repo.create({ title: "Test", slug: "my-slug", summary: Option.none() })
    )
    const found = await Effect.runPromise(repo.findBySlug("my-slug"))
    expect(Option.isSome(found)).toBe(true)
    expect(Option.getOrThrow(found).slug).toBe("my-slug")
  })

  it("returns null when story not found by slug", async () => {
    const result = await Effect.runPromise(repo.findBySlug("non-existent-slug"))
    expect(Option.isNone(result)).toBe(true)
  })

  it("finds stories with pagination", async () => {
    await Effect.runPromise(
      repo.create({ title: "Story 1", slug: "story-1", summary: Option.none() })
    )
    await Effect.runPromise(
      repo.create({ title: "Story 2", slug: "story-2", summary: Option.none() })
    )
    await Effect.runPromise(
      repo.create({ title: "Story 3", slug: "story-3", summary: Option.none() })
    )

    const result = await Effect.runPromise(
      repo.findMany(Option.some({ page: 1, limit: 2 }))
    )
    expect(result.data.length).toBe(2)
    expect(result.total).toBe(3)
  })

  it("updates a story", async () => {
    const created = await Effect.runPromise(
      repo.create({
        title: "Original",
        slug: "original",
        summary: Option.none(),
      })
    )
    const updated = await Effect.runPromise(
      repo.update(created.id, { title: Option.some("Updated") })
    )
    expect(updated.title).toBe("Updated")
  })

  it("throws NotFoundError when updating non-existent story", async () => {
    const error = await Effect.runPromise(
      repo
        .update(NON_EXISTENT_ID, { title: Option.some("Nope") })
        .pipe(Effect.flip)
    )
    expect(error._tag).toBe("NotFoundError")
  })

  it("deletes a story", async () => {
    const created = await Effect.runPromise(
      repo.create({
        title: "Delete Me",
        slug: "delete-me",
        summary: Option.none(),
      })
    )
    await Effect.runPromise(repo.delete(created.id))
    const found = await Effect.runPromise(repo.findById(created.id))
    expect(Option.isNone(found)).toBe(true)
  })

  it("throws NotFoundError when deleting non-existent story", async () => {
    const error = await Effect.runPromise(
      repo.delete(NON_EXISTENT_ID).pipe(Effect.flip)
    )
    expect(error._tag).toBe("NotFoundError")
  })
})
