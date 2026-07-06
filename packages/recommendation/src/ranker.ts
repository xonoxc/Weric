import type { ScoredStory } from "./scorer.ts"
import type { StoryWithEvidenceCount } from "@weric/database"
import { FeedDiversifier } from "./diversifier.ts"

export interface RankedFeed {
  items: StoryWithEvidenceCount[]
  scores: Map<string, number>
  reasons: Map<string, string | undefined>
}

export class FeedRanker {
  private diversifier = new FeedDiversifier()

  rank(scoredStories: ScoredStory[], limit: number): RankedFeed {
    const sorted = [...scoredStories].sort((a, b) => b.finalScore - a.finalScore)
    const diversified = this.diversifier.diversify(sorted, limit)

    const scores = new Map<string, number>()
    const reasons = new Map<string, string | undefined>()

    for (const s of diversified) {
      scores.set(s.story.id, s.finalScore)

      const parts: string[] = []
      if (s.freshnessScore > 0.7) parts.push("recent")
      if (s.qualityScore > 0.7) parts.push("high quality")
      if (s.interestScore > 0.3) parts.push("matches your interests")

      reasons.set(s.story.id, parts.length > 0 ? parts.join(", ") : undefined)
    }

    return {
      items: diversified.map(s => s.story),
      scores,
      reasons,
    }
  }
}
