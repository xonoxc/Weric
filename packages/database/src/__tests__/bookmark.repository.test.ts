import { describe, expect, it, beforeEach } from "@effect/vitest"
import { Effect, Layer, Option } from "effect"
import {
  BookmarkRepository,
  BookmarkRepositoryLive,
} from "~db/repositories/bookmark.repository.ts"
import {
  StoryRepository,
  StoryRepositoryLive,
} from "~db/repositories/story.repository.ts"
import { getTestDb, cleanDatabase } from "~db/__tests__/helpers.ts"
import { users } from "~db/schema/tables.ts"

import { Database } from "~db/connection.ts"
import type { Db } from "~db/connection.ts"

const databaseLayer = Layer.effect(
  Database,
  Effect.sync(() => getTestDb())
)
const bookmarkRepoLayer = Layer.mergeAll(
  databaseLayer,
  BookmarkRepositoryLive.pipe(Layer.provide(databaseLayer)),
  StoryRepositoryLive.pipe(Layer.provide(databaseLayer))
)

function insertTestUser(db: Db): Effect.Effect<typeof users.$inferSelect> {
  return Effect.promise(async () => {
    const [row] = await db
      .insert(users)
      .values({
        name: "BM User",
        email: "bm@test.com",
        username: "bmuser",
      })
      .returning()
    return row!
  })
}

describe("BookmarkRepository", () => {
  beforeEach(() => cleanDatabase())

  it.effect("creates a bookmark", () =>
    Effect.gen(function* () {
      const repo = yield* BookmarkRepository
      const storyRepo = yield* StoryRepository
      const db = yield* Database

      const user = yield* insertTestUser(db)
      const story = yield* storyRepo.create({
        title: "BM Story",
        slug: "bm-story",
        summary: Option.none(),
      })

      const bookmark = yield* repo.create(user.id, story.id)

      expect(bookmark.userId).toBe(user.id)
      expect(bookmark.storyId).toBe(story.id)
    }).pipe(Effect.provide(bookmarkRepoLayer))
  )

  it.effect("throws ConflictError when bookmark already exists", () =>
    Effect.gen(function* () {
      const repo = yield* BookmarkRepository
      const storyRepo = yield* StoryRepository
      const db = yield* Database

      const user = yield* insertTestUser(db)
      const story = yield* storyRepo.create({
        title: "BM Story",
        slug: "bm-story",
        summary: Option.none(),
      })

      yield* repo.create(user.id, story.id)

      const error = yield* repo.create(user.id, story.id).pipe(Effect.flip)
      expect(error._tag).toBe("ConflictError")
    }).pipe(Effect.provide(bookmarkRepoLayer))
  )

  it.effect("finds bookmarks by user", () =>
    Effect.gen(function* () {
      const repo = yield* BookmarkRepository
      const storyRepo = yield* StoryRepository
      const db = yield* Database

      const user = yield* insertTestUser(db)
      const story = yield* storyRepo.create({
        title: "BM Story",
        slug: "bm-story",
        summary: Option.none(),
      })

      yield* repo.create(user.id, story.id)

      const results = yield* repo.findByUser(user.id)
      expect(results.length).toBe(1)
    }).pipe(Effect.provide(bookmarkRepoLayer))
  )

  it.effect("deletes a bookmark", () =>
    Effect.gen(function* () {
      const repo = yield* BookmarkRepository
      const storyRepo = yield* StoryRepository
      const db = yield* Database

      const user = yield* insertTestUser(db)
      const story = yield* storyRepo.create({
        title: "BM Story",
        slug: "bm-story",
        summary: Option.none(),
      })

      yield* repo.create(user.id, story.id)
      yield* repo.delete(user.id, story.id)

      const exists = yield* repo.exists(user.id, story.id)
      expect(exists).toBe(false)
    }).pipe(Effect.provide(bookmarkRepoLayer))
  )

  it.effect("throws NotFoundError when deleting non-existent bookmark", () =>
    Effect.gen(function* () {
      const repo = yield* BookmarkRepository
      const storyRepo = yield* StoryRepository
      const db = yield* Database

      const user = yield* insertTestUser(db)
      const story = yield* storyRepo.create({
        title: "BM Story",
        slug: "bm-story",
        summary: Option.none(),
      })

      const error = yield* repo.delete(user.id, story.id).pipe(Effect.flip)
      expect(error._tag).toBe("NotFoundError")
    }).pipe(Effect.provide(bookmarkRepoLayer))
  )

  it.effect("checks existence", () =>
    Effect.gen(function* () {
      const repo = yield* BookmarkRepository
      const storyRepo = yield* StoryRepository
      const db = yield* Database

      const user = yield* insertTestUser(db)

      const story = yield* storyRepo.create({
        title: "BM Story",
        slug: "bm-story",
        summary: Option.none(),
      })

      const before = yield* repo.exists(user.id, story.id)
      expect(before).toBe(false)

      yield* repo.create(user.id, story.id)
      const after = yield* repo.exists(user.id, story.id)

      expect(after).toBe(true)
    }).pipe(Effect.provide(bookmarkRepoLayer))
  )
})
