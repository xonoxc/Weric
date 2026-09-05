import { Effect } from "effect"

import type { StoryWithEvidenceCount, InterestRow } from "@weric/database"

export interface ScoredStory {
  story: StoryWithEvidenceCount
  freshnessScore: number
  qualityScore: number
  interestScore: number
  interactionPenalty: number
  finalScore: number
}

export interface StoryScorerShape {
  readonly scoreMany: (
    stories: StoryWithEvidenceCount[],
    interests: InterestRow[],
    interactedStoryIds: Set<string>
  ) => ScoredStory[]

  readonly scoreOne: (
    story: StoryWithEvidenceCount,
    interests: InterestRow[],
    interactedStoryIds: Set<string>
  ) => ScoredStory
}

const scoreOne = (
  story: StoryWithEvidenceCount,
  interests: InterestRow[],
  interactedStoryIds: Set<string>
): ScoredStory => {
  const freshnessScore = computeFreshness(story.createdAt)
  const qualityScore = computeQuality(story)
  const interestScore = computeInterestMatch(story, interests)
  const interactionPenalty = interactedStoryIds.has(story.id) ? 0.3 : 0

  const finalScore =
    freshnessScore * 0.15 +
    qualityScore * 0.35 +
    interestScore * 0.4 +
    (1 - interactionPenalty) * 0.1

  return {
    story,
    freshnessScore,
    qualityScore,
    interestScore,
    interactionPenalty,
    finalScore: Math.max(0, Math.min(1, finalScore)),
  }
}

const scoreMany = (
  stories: StoryWithEvidenceCount[],
  interests: InterestRow[],
  interactedStoryIds: Set<string>
): ScoredStory[] =>
  stories.map(story => scoreOne(story, interests, interactedStoryIds))

export class StoryScorer extends Effect.Service<StoryScorerShape>()(
  "StoryScorer",
  {
    effect: Effect.sync(() => ({
      scoreMany,
      scoreOne,
    })),
  }
) {}

export const StoryScorerLive = StoryScorer.Default

function computeFreshness(createdAt: string): number {
  const created = new Date(createdAt).getTime()
  const ageHours = (Date.now() - created) / 3_600_000
  return Math.max(0, 1 - ageHours / 168)
}

function computeQuality(story: StoryWithEvidenceCount): number {
  const evidenceScore = Math.min(1, Math.log2(story.evidenceCount + 1) / 5)
  return evidenceScore * 0.4 + story.confidence * 0.6
}

function computeInterestMatch(
  story: StoryWithEvidenceCount,
  interests: InterestRow[]
): number {
  if (interests.length === 0) return 0.5

  const text = `${story.title} ${story.summary}`.toLowerCase()
  let matchScore = 0
  let totalWeight = 0

  for (const interest of interests) {
    const topic = interest.topic.toLowerCase()
    if (text.includes(topic)) {
      matchScore += interest.score * topic.length
    }
    totalWeight += interest.score
  }

  if (totalWeight === 0) return 0.5

  return Math.min(1, matchScore / (totalWeight * 10))
}
