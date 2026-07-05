import { describe, expect, it, beforeEach } from "vitest"
import { Effect } from "effect"
import { EvidenceRepository } from "~/repositories/evidence.repository.ts"
import { getTestDb, cleanDatabase } from "~/__tests__/helpers.ts"
import type { Db } from "~/connection.ts"

const NON_EXISTENT_ID = "00000000-0000-0000-0000-000000000000"

describe("EvidenceRepository", () => {
  let repo: EvidenceRepository

  beforeEach(async () => {
    await cleanDatabase()
    const db: Db = getTestDb()
    repo = new EvidenceRepository(db)
  })

  it("creates an evidence record", async () => {
    const ev = await Effect.runPromise(
      repo.create({
        source: "news",
        url: "https://example.com/article",
        title: "Test Article",
        content: "Article content here",
      })
    )
    expect(ev.title).toBe("Test Article")
    expect(ev.url).toBe("https://example.com/article")
    expect(ev.source).toBe("news")
    expect(ev.id).toBeDefined()
  })

  it("creates evidence with metadata", async () => {
    const ev = await Effect.runPromise(
      repo.create({
        source: "news",
        url: "https://example.com/meta",
        title: "With Meta",
        content: "Content",
        metadata: { category: "tech", tags: ["ai"] },
      })
    )
    expect(ev.metadata).toEqual({ category: "tech", tags: ["ai"] })
  })

  it("throws ConflictError when url already exists", async () => {
    await Effect.runPromise(
      repo.create({
        source: "news",
        url: "https://example.com/dup",
        title: "First",
        content: "First content",
      })
    )
    const error = await Effect.runPromise(
      repo
        .create({
          source: "blog",
          url: "https://example.com/dup",
          title: "Second",
          content: "Second content",
        })
        .pipe(Effect.flip)
    )
    expect(error._tag).toBe("ConflictError")
  })

  it("finds evidence by id", async () => {
    const created = await Effect.runPromise(
      repo.create({
        source: "news",
        url: "https://example.com/find",
        title: "Find Me",
        content: "Content",
      })
    )
    const found = await Effect.runPromise(repo.findById(created.id))
    expect(found).not.toBeNull()
    expect(found!.id).toBe(created.id)
  })

  it("returns null when evidence not found by id", async () => {
    const result = await Effect.runPromise(repo.findById(NON_EXISTENT_ID))
    expect(result).toBeNull()
  })

  it("finds evidence by url", async () => {
    const url = "https://example.com/by-url"
    await Effect.runPromise(
      repo.create({
        source: "news",
        url,
        title: "By URL",
        content: "Content",
      })
    )
    const found = await Effect.runPromise(repo.findByUrl(url))
    expect(found).not.toBeNull()
    expect(found!.url).toBe(url)
  })

  it("finds evidence by source", async () => {
    await Effect.runPromise(
      repo.create({
        source: "twitter",
        url: "https://twitter.com/1",
        title: "Tweet 1",
        content: "Content 1",
      })
    )
    await Effect.runPromise(
      repo.create({
        source: "twitter",
        url: "https://twitter.com/2",
        title: "Tweet 2",
        content: "Content 2",
      })
    )

    const results = await Effect.runPromise(repo.findBySource("twitter"))
    expect(results.length).toBe(2)
  })

  it("finds evidence with pagination", async () => {
    await Effect.runPromise(
      repo.create({
        source: "news",
        url: "https://example.com/p1",
        title: "Page 1",
        content: "Content",
      })
    )
    await Effect.runPromise(
      repo.create({
        source: "news",
        url: "https://example.com/p2",
        title: "Page 2",
        content: "Content",
      })
    )
    await Effect.runPromise(
      repo.create({
        source: "news",
        url: "https://example.com/p3",
        title: "Page 3",
        content: "Content",
      })
    )

    const result = await Effect.runPromise(repo.findMany({ page: 1, limit: 2 }))
    expect(result.data.length).toBe(2)
    expect(result.total).toBe(3)
  })
})
