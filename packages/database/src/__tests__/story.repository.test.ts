import { describe, expect, it, beforeEach } from "vitest"
import { Effect } from "effect"
import { StoryRepository } from "~/repositories/story.repository.ts"
import { getTestDb, cleanDatabase } from "~/__tests__/helpers.ts"
import type { Db } from "~/connection.ts"

const NON_EXISTENT_ID = "00000000-0000-0000-0000-000000000000"

describe("StoryRepository", () => {
  let repo: StoryRepository

  beforeEach(async () => {
    await cleanDatabase()
    const db: Db = getTestDb()
    repo = new StoryRepository(db)
  })

  it("creates a story with basic fields", async () => {
    const story = await Effect.runPromise(
      repo.create({ title: "Test Story", slug: "test-story" })
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
        summary: "A brief summary",
      })
    )
    expect(story.summary).toBe("A brief summary")
  })

  it("finds a story by id", async () => {
    const created = await Effect.runPromise(repo.create({ title: "Test", slug: "test" }))
    const found = await Effect.runPromise(repo.findById(created.id))
    expect(found).not.toBeNull()
    expect(found!.id).toBe(created.id)
  })

  it("returns null when story not found by id", async () => {
    const result = await Effect.runPromise(repo.findById(NON_EXISTENT_ID))
    expect(result).toBeNull()
  })

  it("finds a story by slug", async () => {
    await Effect.runPromise(repo.create({ title: "Test", slug: "my-slug" }))
    const found = await Effect.runPromise(repo.findBySlug("my-slug"))
    expect(found).not.toBeNull()
    expect(found!.slug).toBe("my-slug")
  })

  it("returns null when story not found by slug", async () => {
    const result = await Effect.runPromise(repo.findBySlug("non-existent-slug"))
    expect(result).toBeNull()
  })

  it("finds stories with pagination", async () => {
    await Effect.runPromise(repo.create({ title: "Story 1", slug: "story-1" }))
    await Effect.runPromise(repo.create({ title: "Story 2", slug: "story-2" }))
    await Effect.runPromise(repo.create({ title: "Story 3", slug: "story-3" }))

    const result = await Effect.runPromise(repo.findMany({ page: 1, limit: 2 }))
    expect(result.data.length).toBe(2)
    expect(result.total).toBe(3)
  })

  it("updates a story", async () => {
    const created = await Effect.runPromise(
      repo.create({ title: "Original", slug: "original" })
    )
    const updated = await Effect.runPromise(repo.update(created.id, { title: "Updated" }))
    expect(updated.title).toBe("Updated")
  })

  it("throws NotFoundError when updating non-existent story", async () => {
    const error = await Effect.runPromise(
      repo.update(NON_EXISTENT_ID, { title: "Nope" }).pipe(Effect.flip)
    )
    expect(error._tag).toBe("NotFoundError")
  })

  it("deletes a story", async () => {
    const created = await Effect.runPromise(
      repo.create({ title: "Delete Me", slug: "delete-me" })
    )
    await Effect.runPromise(repo.delete(created.id))
    const found = await Effect.runPromise(repo.findById(created.id))
    expect(found).toBeNull()
  })

  it("throws NotFoundError when deleting non-existent story", async () => {
    const error = await Effect.runPromise(repo.delete(NON_EXISTENT_ID).pipe(Effect.flip))
    expect(error._tag).toBe("NotFoundError")
  })
})
