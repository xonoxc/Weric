import { describe, expect, it } from "vitest"
import { FeedRanker } from "../ranker.ts"
import type { ScoredStory } from "../scorer.ts"
import type { StoryWithEvidenceCount } from "@weric/database"

function makeScored(
  id: string,
  title: string,
  overrides: Partial<ScoredStory> = {}
): ScoredStory {
  const story: StoryWithEvidenceCount = {
    id,
    title,
    slug: title.toLowerCase().replace(/\s+/g, "-"),
    summary: `Summary of ${title}`,
    confidence: 0.5,
    status: "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    evidenceCount: 5,
  }
  return {
    story,
    freshnessScore: 0.5,
    qualityScore: 0.5,
    interestScore: 0.5,
    interactionPenalty: 0,
    finalScore: 0.5,
    ...overrides,
  }
}

describe("FeedRanker", () => {
  const ranker = new FeedRanker()

  it("returns empty items when given no stories", () => {
    const result = ranker.rank([], 10)
    expect(result.items).toHaveLength(0)
    expect(result.scores.size).toBe(0)
    expect(result.reasons.size).toBe(0)
  })

  it("sorts stories by final score descending", () => {
    const items = [
      makeScored("s1", "Story One", { finalScore: 0.3 }),
      makeScored("s2", "Story Two", { finalScore: 0.9 }),
      makeScored("s3", "Story Three", { finalScore: 0.6 }),
    ]
    const result = ranker.rank(items, 3)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]!.id).toBe("s2")
    expect(result.items[1]!.id).toBe("s3")
    expect(result.items[2]!.id).toBe("s1")
  })

  it("respects the limit", () => {
    const items = [
      makeScored("s1", "Story One", { finalScore: 0.5 }),
      makeScored("s2", "Story Two", { finalScore: 0.5 }),
      makeScored("s3", "Story Three", { finalScore: 0.5 }),
      makeScored("s4", "Story Four", { finalScore: 0.5 }),
    ]
    const result = ranker.rank(items, 2)
    expect(result.items.length).toBeLessThanOrEqual(2)
  })

  it("generates reasons for high-scoring stories", () => {
    const items = [
      makeScored("s1", "Fresh News", {
        freshnessScore: 0.9,
        qualityScore: 0.5,
        interestScore: 0.1,
        finalScore: 0.7,
      }),
      makeScored("s2", "Old News", {
        freshnessScore: 0.1,
        qualityScore: 0.5,
        interestScore: 0.1,
        finalScore: 0.3,
      }),
    ]
    const result = ranker.rank(items, 2)
    expect(result.reasons.get("s1")).toBe("recent")
    expect(result.reasons.get("s2")).toBeUndefined()
  })

  it("combines multiple reasons", () => {
    const items = [
      makeScored("s1", "Fresh Quality Story", {
        freshnessScore: 0.9,
        qualityScore: 0.8,
        interestScore: 0.2,
        finalScore: 0.9,
      }),
    ]
    const result = ranker.rank(items, 1)
    expect(result.reasons.get("s1")).toBe("recent, high quality")
  })
})
