import { describe, expect, it, beforeEach } from "@effect/vitest"
import { Effect, Layer, Option } from "effect"
import {
  StoryRepository,
  StoryRepositoryLive,
} from "~db/repositories/story.repository.ts"
import { getTestDb, cleanDatabase } from "~db/__tests__/helpers.ts"

import { Database } from "~db/connection.ts"

const NON_EXISTENT_ID = "00000000-0000-0000-0000-000000000000"

const databaseLayer = Layer.effect(
  Database,
  Effect.sync(() => getTestDb())
)

const storyRepoLayer = Layer.mergeAll(
  databaseLayer,
  StoryRepositoryLive.pipe(Layer.provide(databaseLayer))
)

describe("StoryRepository", () => {
  beforeEach(() => cleanDatabase())

  it.effect("creates a story with basic fields", () =>
    Effect.gen(function* () {
      const repo = yield* StoryRepository

      const story = yield* repo.create({
        title: "Test Story",
        slug: "test-story",
        summary: Option.none(),
      })

      expect(story.title).toBe("Test Story")
      expect(story.slug).toBe("test-story")

      expect(story.summary).toBeNull()
      expect(story.id).toBeDefined()

      expect(story.createdAt).toBeInstanceOf(Date)
    }).pipe(Effect.provide(storyRepoLayer))
  )

  it.effect("creates a story with summary", () =>
    Effect.gen(function* () {
      const repo = yield* StoryRepository

      const story = yield* repo.create({
        title: "Test Story",
        slug: "test-story",
        summary: Option.some("A brief summary"),
      })

      expect(story.summary).toBe("A brief summary")
    }).pipe(Effect.provide(storyRepoLayer))
  )

  it.effect("finds a story by id", () =>
    Effect.gen(function* () {
      const repo = yield* StoryRepository

      const created = yield* repo.create({
        title: "Test",
        slug: "test",
        summary: Option.none(),
      })

      const found = yield* repo.findById(created.id)
      expect(Option.isSome(found)).toBe(true)

      expect(Option.getOrThrow(found).id).toBe(created.id)
    }).pipe(Effect.provide(storyRepoLayer))
  )

  it.effect("returns none when story not found by id", () =>
    Effect.gen(function* () {
      const repo = yield* StoryRepository

      const result = yield* repo.findById(NON_EXISTENT_ID)

      expect(Option.isNone(result)).toBe(true)
    }).pipe(Effect.provide(storyRepoLayer))
  )

  it.effect("finds a story by slug", () =>
    Effect.gen(function* () {
      const repo = yield* StoryRepository

      yield* repo.create({
        title: "Test",
        slug: "my-slug",
        summary: Option.none(),
      })

      const found = yield* repo.findBySlug("my-slug")
      expect(Option.isSome(found)).toBe(true)

      expect(Option.getOrThrow(found).slug).toBe("my-slug")
    }).pipe(Effect.provide(storyRepoLayer))
  )

  it.effect("returns none when story not found by slug", () =>
    Effect.gen(function* () {
      const repo = yield* StoryRepository

      const result = yield* repo.findBySlug("non-existent-slug")
      expect(Option.isNone(result)).toBe(true)
    }).pipe(Effect.provide(storyRepoLayer))
  )

  it.effect("finds stories with pagination", () =>
    Effect.gen(function* () {
      const repo = yield* StoryRepository

      yield* repo.create({
        title: "Story 1",
        slug: "story-1",
        summary: Option.none(),
      })
      yield* repo.create({
        title: "Story 2",
        slug: "story-2",
        summary: Option.none(),
      })
      yield* repo.create({
        title: "Story 3",
        slug: "story-3",
        summary: Option.none(),
      })

      const result = yield* repo.findMany(Option.some({ page: 1, limit: 2 }))
      expect(result.data.length).toBe(2)

      expect(result.total).toBe(3)
    }).pipe(Effect.provide(storyRepoLayer))
  )

  it.effect("updates a story", () =>
    Effect.gen(function* () {
      const repo = yield* StoryRepository

      const created = yield* repo.create({
        title: "Original",
        slug: "original",
        summary: Option.none(),
      })

      const updated = yield* repo.update(created.id, {
        title: Option.some("Updated"),
      })

      expect(updated.title).toBe("Updated")
    }).pipe(Effect.provide(storyRepoLayer))
  )

  it.effect("throws NotFoundError when updating non-existent story", () =>
    Effect.gen(function* () {
      const repo = yield* StoryRepository

      const error = yield* repo
        .update(NON_EXISTENT_ID, { title: Option.some("Nope") })
        .pipe(Effect.flip)

      expect(error._tag).toBe("NotFoundError")
    }).pipe(Effect.provide(storyRepoLayer))
  )

  it.effect("deletes a story", () =>
    Effect.gen(function* () {
      const repo = yield* StoryRepository

      const created = yield* repo.create({
        title: "Delete Me",
        slug: "delete-me",
        summary: Option.none(),
      })

      yield* repo.delete(created.id)

      const found = yield* repo.findById(created.id)

      expect(Option.isNone(found)).toBe(true)
    }).pipe(Effect.provide(storyRepoLayer))
  )

  it.effect("throws NotFoundError when deleting non-existent story", () =>
    Effect.gen(function* () {
      const repo = yield* StoryRepository

      const error = yield* repo.delete(NON_EXISTENT_ID).pipe(Effect.flip)

      expect(error._tag).toBe("NotFoundError")
    }).pipe(Effect.provide(storyRepoLayer))
  )
})
