import { describe, expect, it, vi } from "vitest"
import { InterestLearner } from "../interest.ts"
import type { StoryWithEvidenceCount, InterestRow } from "@weric/database"
import { InterestRepository } from "@weric/database"
import { Effect } from "effect"

function makeStory(
  overrides: Partial<StoryWithEvidenceCount> = {}
): StoryWithEvidenceCount {
  return {
    id: "story-1",
    title: "Breakthrough in AI Research",
    slug: "breakthrough-in-ai-research",
    summary:
      "New findings in artificial intelligence and machine learning research",
    confidence: 0.8,
    status: "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    evidenceCount: 10,
    ...overrides,
  }
}

describe("InterestLearner", () => {
  describe("extractTopics", () => {
    const learner = new InterestLearner({} as InterestRepository)

    it("extracts significant words from story title", () => {
      const story = makeStory({ title: "AI Research Breakthrough Discovery" })
      const topics = learner.extractTopics(story)
      expect(topics.length).toBeGreaterThan(0)
      const words = topics.map(t => t.topic)
      expect(words).toContain("breakthrough")
      expect(words).toContain("research")
    })

    it("boosts words that appear in both title and summary", () => {
      const story = makeStory({
        title: "Research Discovery",
        summary: "More about the research discovery",
      })
      const topics = learner.extractTopics(story)
      const research = topics.find(t => t.topic === "research")
      expect(research).toBeDefined()
      expect(research!.score).toBeGreaterThan(0.1)
    })

    it("gives extra weight to boost words", () => {
      const story = makeStory({ title: "Breakthrough Novel Ideas" })
      const topics = learner.extractTopics(story)
      const breakthrough = topics.find(t => t.topic === "breakthrough")
      const novel = topics.find(t => t.topic === "novel")
      if (breakthrough && novel) {
        expect(breakthrough.score).toBeGreaterThan(novel.score)
      }
    })

    it("filters out stop words", () => {
      const story = makeStory({
        title: "This About That From The Research Study",
      })
      const topics = learner.extractTopics(story)
      const words = topics.map(t => t.topic)
      expect(words).not.toContain("this")
      expect(words).not.toContain("about")
      expect(words).not.toContain("that")
      expect(words).toContain("research")
      expect(words).toContain("study")
    })

    it("limits to MAX_TOPICS results", () => {
      const story = makeStory({
        title: "One Two Three Four Five Six Seven Eight Nine Ten Eleven",
      })
      const topics = learner.extractTopics(story)
      expect(topics.length).toBeLessThanOrEqual(10)
    })

    it("returns empty array for empty title", () => {
      const story = makeStory({ title: "", summary: "" })
      const topics = learner.extractTopics(story)
      expect(topics).toHaveLength(0)
    })
  })
})
