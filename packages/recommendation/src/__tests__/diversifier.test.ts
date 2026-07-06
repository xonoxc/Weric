import { describe, expect, it } from "vitest"
import { FeedDiversifier } from "../diversifier.ts"
import type { ScoredStory } from "../scorer.ts"
import type { StoryWithEvidenceCount } from "@weric/database"

function makeScored(title: string, score = 0.5): ScoredStory {
  const story: StoryWithEvidenceCount = {
    id: `story-${title.replace(/\s+/g, "-").toLowerCase()}`,
    title,
    slug: title.toLowerCase().replace(/\s+/g, "-"),
    summary: `Summary of ${title}`,
    confidence: score,
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
    finalScore: score,
  }
}

describe("FeedDiversifier", () => {
  const diversifier = new FeedDiversifier()

  it("returns all items when fewer than requested count", () => {
    const items = [makeScored("AI Research"), makeScored("Sports")]
    const result = diversifier.diversify(items, 10)
    expect(result).toHaveLength(2)
  })

  it("diversifies by extracting topic from title", () => {
    const items = [
      makeScored("AI Research Breakthrough"),
      makeScored("AI in Healthcare"),
      makeScored("Sports News"),
      makeScored("Sports Results"),
      makeScored("Music Review"),
    ]

    const result = diversifier.diversify(items, 3)
    expect(result).toHaveLength(3)

    const topics = result.map(s => s.story.title)
    expect(new Set(topics).size).toBe(3)
  })

  it("uses 'general' topic when title has no significant words", () => {
    const items = [makeScored("A"), makeScored("An"), makeScored("The")]
    const result = diversifier.diversify(items, 3)
    expect(result).toHaveLength(3)
  })

  it("stops early when no more stories to pick", () => {
    const items = [makeScored("Only Story")]
    const result = diversifier.diversify(items, 10)
    expect(result).toHaveLength(1)
  })

  it("preserves order within same bucket (by score)", () => {
    const items = [
      makeScored("Sports News", 0.9),
      makeScored("Sports Finals", 0.8),
    ]
    const result = diversifier.diversify(items, 2)
    expect(result).toHaveLength(2)
    expect(result[0]!.finalScore).toBeGreaterThanOrEqual(result[1]!.finalScore)
  })
})
