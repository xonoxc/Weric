import { describe, expect, it, beforeEach } from "vitest"
import { Effect } from "effect"
import { BookmarkRepository } from "~/repositories/bookmark.repository.ts"
import { StoryRepository } from "~/repositories/story.repository.ts"
import { getTestDb, cleanDatabase } from "~/__tests__/helpers.ts"
import { users } from "~/schema/tables.ts"
import type { Db } from "~/connection.ts"

describe("BookmarkRepository", () => {
  let repo: BookmarkRepository
  let userId: string
  let storyId: string

  beforeEach(async () => {
    await cleanDatabase()
    const db: Db = getTestDb()
    repo = new BookmarkRepository(db)
    const storyRepo = new StoryRepository(db)

    const [user] = await db
      .insert(users)
      .values({
        name: "BM User",
        email: "bm@test.com",
        username: "bmuser",
      })
      .returning()
    userId = user!.id

    const story = await Effect.runPromise(
      storyRepo.create({ title: "BM Story", slug: "bm-story" })
    )
    storyId = story.id
  })

  it("creates a bookmark", async () => {
    const bookmark = await Effect.runPromise(repo.create(userId, storyId))
    expect(bookmark.userId).toBe(userId)
    expect(bookmark.storyId).toBe(storyId)
  })

  it("throws ConflictError when bookmark already exists", async () => {
    await Effect.runPromise(repo.create(userId, storyId))
    const error = await Effect.runPromise(repo.create(userId, storyId).pipe(Effect.flip))
    expect(error._tag).toBe("ConflictError")
  })

  it("finds bookmarks by user", async () => {
    await Effect.runPromise(repo.create(userId, storyId))
    const results = await Effect.runPromise(repo.findByUser(userId))
    expect(results.length).toBe(1)
  })

  it("deletes a bookmark", async () => {
    await Effect.runPromise(repo.create(userId, storyId))
    await Effect.runPromise(repo.delete(userId, storyId))
    const exists = await Effect.runPromise(repo.exists(userId, storyId))
    expect(exists).toBe(false)
  })

  it("throws NotFoundError when deleting non-existent bookmark", async () => {
    const error = await Effect.runPromise(repo.delete(userId, storyId).pipe(Effect.flip))
    expect(error._tag).toBe("NotFoundError")
  })

  it("checks existence", async () => {
    const before = await Effect.runPromise(repo.exists(userId, storyId))
    expect(before).toBe(false)

    await Effect.runPromise(repo.create(userId, storyId))
    const after = await Effect.runPromise(repo.exists(userId, storyId))
    expect(after).toBe(true)
  })
})
