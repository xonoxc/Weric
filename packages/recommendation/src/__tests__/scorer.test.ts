import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"
import { StoryScorer, StoryScorerLive } from "~rec/scorer.ts"

import type { StoryWithEvidenceCount, InterestRow } from "@weric/database"

function makeStory(
  overrides: Partial<StoryWithEvidenceCount> = {}
): StoryWithEvidenceCount {
  return {
    id: "story-1",
    title: "Test Story About AI",
    slug: "test-story-about-ai",
    summary: "A test story about artificial intelligence and machine learning",
    confidence: 0.5,
    status: "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    evidenceCount: 5,
    ...overrides,
  }
}

function makeInterest(topic: string, score = 0.8): InterestRow {
  return {
    id: `int-${topic}`,
    userId: "user-1",
    topic,
    score,
    updatedAt: new Date().toISOString(),
  }
}

describe("StoryScorer", () => {
  describe("computeFreshness", () => {
    it.effect("gives max freshness for story created moments ago", () =>
      Effect.gen(function* () {
        const scorer = yield* StoryScorer

        const story = makeStory({
          createdAt: new Date().toISOString(),
        })
        const result = scorer.scoreOne(story, [], new Set())

        expect(result.freshnessScore).toBeGreaterThan(0.99)
      }).pipe(Effect.provide(StoryScorerLive))
    )

    it.effect("gives near-zero freshness for story created 7+ days ago", () =>
      Effect.gen(function* () {
        const scorer = yield* StoryScorer

        const old = new Date(Date.now() - 8 * 86_400_000).toISOString()
        const story = makeStory({ createdAt: old })

        const result = scorer.scoreOne(story, [], new Set())
        expect(result.freshnessScore).toBeLessThan(0.05)
      }).pipe(Effect.provide(StoryScorerLive))
    )

    it.effect("gives intermediate freshness for story created 3 days ago", () =>
      Effect.gen(function* () {
        const scorer = yield* StoryScorer
        const mid = new Date(Date.now() - 3 * 86_400_000).toISOString()

        const story = makeStory({ createdAt: mid })
        const result = scorer.scoreOne(story, [], new Set())

        expect(result.freshnessScore).toBeGreaterThan(0.4)
        expect(result.freshnessScore).toBeLessThan(0.6)
      }).pipe(Effect.provide(StoryScorerLive))
    )
  })

  describe("computeQuality", () => {
    it.effect("increases with evidence count", () =>
      Effect.gen(function* () {
        const scorer = yield* StoryScorer

        const low = makeStory({ evidenceCount: 1, confidence: 0.5 })
        const high = makeStory({ evidenceCount: 20, confidence: 0.5 })

        const lowScore = scorer.scoreOne(low, [], new Set())
        const highScore = scorer.scoreOne(high, [], new Set())

        expect(highScore.qualityScore).toBeGreaterThan(lowScore.qualityScore)
      }).pipe(Effect.provide(StoryScorerLive))
    )

    it.effect("increases with confidence", () =>
      Effect.gen(function* () {
        const scorer = yield* StoryScorer

        const low = makeStory({ confidence: 0.2, evidenceCount: 5 })
        const high = makeStory({ confidence: 0.9, evidenceCount: 5 })

        const lowScore = scorer.scoreOne(low, [], new Set())
        const highScore = scorer.scoreOne(high, [], new Set())

        expect(highScore.qualityScore).toBeGreaterThan(lowScore.qualityScore)
      }).pipe(Effect.provide(StoryScorerLive))
    )
  })

  describe("computeInterestMatch", () => {
    it.effect("returns neutral score when no interests exist", () =>
      Effect.gen(function* () {
        const scorer = yield* StoryScorer

        const story = makeStory()
        const result = scorer.scoreOne(story, [], new Set())

        expect(result.interestScore).toBe(0.5)
      }).pipe(Effect.provide(StoryScorerLive))
    )

    it.effect("returns positive score when interests match story content", () =>
      Effect.gen(function* () {
        const scorer = yield* StoryScorer

        const story = makeStory({
          title: "Breakthrough in AI Research",
          summary: "New findings in artificial intelligence",
        })
        const interests = [makeInterest("artificial intelligence", 0.9)]

        const result = scorer.scoreOne(story, interests, new Set())
        expect(result.interestScore).toBeGreaterThan(0.3)
      }).pipe(Effect.provide(StoryScorerLive))
    )

    it.effect("returns zero when interests do not match story content", () =>
      Effect.gen(function* () {
        const scorer = yield* StoryScorer

        const story = makeStory({
          title: "Sports Championship Results",
          summary: "Latest scores from the tournament",
        })
        const interests = [makeInterest("quantum physics", 0.9)]

        const result = scorer.scoreOne(story, interests, new Set())
        expect(result.interestScore).toBe(0)
      }).pipe(Effect.provide(StoryScorerLive))
    )
  })

  describe("interactionPenalty", () => {
    it.effect("applies penalty when story has been interacted with", () =>
      Effect.gen(function* () {
        const scorer = yield* StoryScorer

        const story = makeStory()
        const interacted = new Set([story.id])
        const result = scorer.scoreOne(story, [], interacted)

        expect(result.interactionPenalty).toBe(0.3)
      }).pipe(Effect.provide(StoryScorerLive))
    )

    it.effect(
      "applies no penalty when story has not been interacted with",
      () =>
        Effect.gen(function* () {
          const scorer = yield* StoryScorer

          const story = makeStory()
          const result = scorer.scoreOne(story, [], new Set())

          expect(result.interactionPenalty).toBe(0)
        }).pipe(Effect.provide(StoryScorerLive))
    )
  })

  describe("finalScore", () => {
    it.effect("is clamped between 0 and 1", () =>
      Effect.gen(function* () {
        const scorer = yield* StoryScorer

        const story = makeStory({
          confidence: 0,
          evidenceCount: 0,
          createdAt: new Date(0).toISOString(),
        })
        const result = scorer.scoreOne(story, [], new Set())

        expect(result.finalScore).toBeLessThanOrEqual(1)
        expect(result.finalScore).toBeGreaterThanOrEqual(0)
      }).pipe(Effect.provide(StoryScorerLive))
    )

    it.effect("produces higher score for better quality + interest match", () =>
      Effect.gen(function* () {
        const scorer = yield* StoryScorer

        const good = makeStory({
          title: "AI Breakthrough Discovery",
          summary: "New findings in artificial intelligence research study",
          confidence: 0.9,
          evidenceCount: 20,
          createdAt: new Date().toISOString(),
        })
        const bad = makeStory({
          title: "Old Unrelated Topic",
          summary: "Something unrelated that was posted long ago",
          confidence: 0.1,
          evidenceCount: 1,
          createdAt: new Date(0).toISOString(),
        })

        const interests = [makeInterest("ai", 1), makeInterest("research", 0.8)]

        const goodResult = scorer.scoreOne(good, interests, new Set())
        const badResult = scorer.scoreOne(bad, interests, new Set())

        expect(goodResult.finalScore).toBeGreaterThan(badResult.finalScore)
      }).pipe(Effect.provide(StoryScorerLive))
    )
  })

  describe("scoreMany", () => {
    it.effect("scores multiple stories", () =>
      Effect.gen(function* () {
        const scorer = yield* StoryScorer

        const stories = [makeStory({ id: "s1" }), makeStory({ id: "s2" })]

        const results = scorer.scoreMany(stories, [], new Set())
        expect(results).toHaveLength(2)

        expect(results[0]!.story.id).toBe("s1")
        expect(results[1]!.story.id).toBe("s2")
      }).pipe(Effect.provide(StoryScorerLive))
    )
  })
})
