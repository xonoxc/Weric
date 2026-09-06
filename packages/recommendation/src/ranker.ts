import { Effect, Option } from "effect"
import { FeedDiversifier } from "./diversifier.ts"

import type { ScoredStory } from "./scorer.ts"
import type { StoryWithEvidenceCount } from "@weric/database"
import type { Optioned } from "@weric/utils"

export interface RankedFeed {
  items: StoryWithEvidenceCount[]
  scores: Map<string, number>
  reasons: Map<string, Optioned<string>>
}

export interface FeedRankerShape {
  readonly rank: (scoredStories: ScoredStory[], limit: number) => RankedFeed
}

export class FeedRanker extends Effect.Service<FeedRankerShape>()(
  "FeedRanker",
  {
    effect: Effect.gen(function* () {
      const diversifier = yield* FeedDiversifier

      const rank = (
        scoredStories: ScoredStory[],
        limit: number
      ): RankedFeed => {
        const sorted = [...scoredStories].sort(
          (a, b) => b.finalScore - a.finalScore
        )
        const diversified = diversifier.diversify(sorted, limit)

        const scores = new Map<string, number>()
        const reasons = new Map<string, Optioned<string>>()

        for (const s of diversified) {
          scores.set(s.story.id, s.finalScore)

          const parts: string[] = []
          if (s.freshnessScore > 0.7) parts.push("recent")
          if (s.qualityScore > 0.7) parts.push("high quality")
          if (s.interestScore > 0.3) parts.push("matches your interests")

          reasons.set(
            s.story.id,
            parts.length > 0 ? Option.some(parts.join(", ")) : Option.none()
          )
        }

        return {
          items: diversified.map(s => s.story),
          scores,
          reasons,
        }
      }

      return { rank } satisfies FeedRankerShape
    }),
  }
) {}

export const FeedRankerLive = FeedRanker.Default
