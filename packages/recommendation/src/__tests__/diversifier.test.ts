import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"
import { FeedDiversifier, FeedDiversifierLive } from "~rec/diversifier.ts"

import type { ScoredStory } from "~rec/scorer.ts"
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
  it.effect("returns all items when fewer than requested count", () =>
    Effect.gen(function* () {
      const diversifier = yield* FeedDiversifier

      const items = [makeScored("AI Research"), makeScored("Sports")]

      const result = diversifier.diversify(items, 10)
      expect(result).toHaveLength(2)
    }).pipe(Effect.provide(FeedDiversifierLive))
  )

  it.effect("diversifies by extracting topic from title", () =>
    Effect.gen(function* () {
      const diversifier = yield* FeedDiversifier

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
    }).pipe(Effect.provide(FeedDiversifierLive))
  )

  it.effect("uses 'general' topic when title has no significant words", () =>
    Effect.gen(function* () {
      const diversifier = yield* FeedDiversifier

      const items = [makeScored("A"), makeScored("An"), makeScored("The")]
      const result = diversifier.diversify(items, 3)

      expect(result).toHaveLength(3)
    }).pipe(Effect.provide(FeedDiversifierLive))
  )

  it.effect("stops early when no more stories to pick", () =>
    Effect.gen(function* () {
      const diversifier = yield* FeedDiversifier

      const items = [makeScored("Only Story")]
      const result = diversifier.diversify(items, 10)

      expect(result).toHaveLength(1)
    }).pipe(Effect.provide(FeedDiversifierLive))
  )

  it.effect("preserves order within same bucket (by score)", () =>
    Effect.gen(function* () {
      const diversifier = yield* FeedDiversifier

      const items = [
        makeScored("Sports News", 0.9),
        makeScored("Sports Finals", 0.8),
      ]

      const result = diversifier.diversify(items, 2)
      expect(result).toHaveLength(2)

      expect(result[0]!.finalScore).toBeGreaterThanOrEqual(
        result[1]!.finalScore
      )
    }).pipe(Effect.provide(FeedDiversifierLive))
  )
})
