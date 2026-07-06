import { describe, expect, it } from "vitest"
import { StoryScorer } from "../scorer.ts"
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
  const scorer = new StoryScorer()

  describe("computeFreshness", () => {
    it("gives max freshness for story created moments ago", () => {
      const story = makeStory({ createdAt: new Date().toISOString() })
      const result = scorer.scoreOne(story, [], new Set())
      expect(result.freshnessScore).toBeGreaterThan(0.99)
    })

    it("gives near-zero freshness for story created 7+ days ago", () => {
      const old = new Date(Date.now() - 8 * 86_400_000).toISOString()
      const story = makeStory({ createdAt: old })
      const result = scorer.scoreOne(story, [], new Set())
      expect(result.freshnessScore).toBeLessThan(0.05)
    })

    it("gives intermediate freshness for story created 3 days ago", () => {
      const mid = new Date(Date.now() - 3 * 86_400_000).toISOString()
      const story = makeStory({ createdAt: mid })
      const result = scorer.scoreOne(story, [], new Set())
      expect(result.freshnessScore).toBeGreaterThan(0.4)
      expect(result.freshnessScore).toBeLessThan(0.6)
    })
  })

  describe("computeQuality", () => {
    it("increases with evidence count", () => {
      const low = makeStory({ evidenceCount: 1, confidence: 0.5 })
      const high = makeStory({ evidenceCount: 20, confidence: 0.5 })
      const lowScore = scorer.scoreOne(low, [], new Set())
      const highScore = scorer.scoreOne(high, [], new Set())
      expect(highScore.qualityScore).toBeGreaterThan(lowScore.qualityScore)
    })

    it("increases with confidence", () => {
      const low = makeStory({ confidence: 0.2, evidenceCount: 5 })
      const high = makeStory({ confidence: 0.9, evidenceCount: 5 })
      const lowScore = scorer.scoreOne(low, [], new Set())
      const highScore = scorer.scoreOne(high, [], new Set())
      expect(highScore.qualityScore).toBeGreaterThan(lowScore.qualityScore)
    })
  })

  describe("computeInterestMatch", () => {
    it("returns neutral score when no interests exist", () => {
      const story = makeStory()
      const result = scorer.scoreOne(story, [], new Set())
      expect(result.interestScore).toBe(0.5)
    })

    it("returns positive score when interests match story content", () => {
      const story = makeStory({
        title: "Breakthrough in AI Research",
        summary: "New findings in artificial intelligence",
      })
      const interests = [makeInterest("artificial intelligence", 0.9)]
      const result = scorer.scoreOne(story, interests, new Set())
      expect(result.interestScore).toBeGreaterThan(0.3)
    })

    it("returns zero when interests do not match story content", () => {
      const story = makeStory({
        title: "Sports Championship Results",
        summary: "Latest scores from the tournament",
      })
      const interests = [makeInterest("quantum physics", 0.9)]
      const result = scorer.scoreOne(story, interests, new Set())
      expect(result.interestScore).toBe(0)
    })
  })

  describe("interactionPenalty", () => {
    it("applies penalty when story has been interacted with", () => {
      const story = makeStory()
      const interacted = new Set([story.id])
      const result = scorer.scoreOne(story, [], interacted)
      expect(result.interactionPenalty).toBe(0.3)
    })

    it("applies no penalty when story has not been interacted with", () => {
      const story = makeStory()
      const result = scorer.scoreOne(story, [], new Set())
      expect(result.interactionPenalty).toBe(0)
    })
  })

  describe("finalScore", () => {
    it("is clamped between 0 and 1", () => {
      const story = makeStory({
        confidence: 0,
        evidenceCount: 0,
        createdAt: new Date(0).toISOString(),
      })
      const result = scorer.scoreOne(story, [], new Set())
      expect(result.finalScore).toBeGreaterThanOrEqual(0)
      expect(result.finalScore).toBeLessThanOrEqual(1)
    })

    it("produces higher score for better quality + interest match", () => {
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
    })
  })

  describe("scoreMany", () => {
    it("scores multiple stories", () => {
      const stories = [makeStory({ id: "s1" }), makeStory({ id: "s2" })]
      const results = scorer.scoreMany(stories, [], new Set())
      expect(results).toHaveLength(2)
      expect(results[0]!.story.id).toBe("s1")
      expect(results[1]!.story.id).toBe("s2")
    })
  })
})
