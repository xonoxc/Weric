import { Layer } from "effect"
import { RecommendationService, RecommendationServiceLive } from "./service.ts"
import { InterestLearnerLive } from "./interest.ts"
import { StoryScorerLive } from "./scorer.ts"
import { FeedRankerLive } from "./ranker.ts"
import { FeedDiversifier, FeedDiversifierLive } from "./diversifier.ts"

/**
 * Fully-composed recommendation layer ("auto DI").
 *
 * Wires every internal collaborator of `RecommendationService`:
 *
 *   StoryScorer      (pure)
 *   FeedDiversifier  (pure)
 *   FeedRanker       <- FeedDiversifier
 *   InterestLearner  <- InterestRepository
 *   RecommendationService <- Story/Interaction/Interest repos + collaborators above
 *
 * Remaining requirements are the repository tags (`StoryRepository`,
 * `InteractionRepository`, `InterestRepository`) — satisfy those with the
 * `*RepositoryLive(db)` layer factories from @weric/database:
 *
 *   const layer = Layer.provide(RecommendationAuto, Layer.mergeAll(
 *     StoryRepositoryLive(db),
 *     InteractionRepositoryLive(db),
 *     InterestRepositoryLive(db),
 *   ))
 */
export const RecommendationAuto = Layer.provide(
  RecommendationServiceLive,
  Layer.mergeAll(
    StoryScorerLive,
    Layer.provide(FeedRankerLive, FeedDiversifierLive),
    FeedDiversifierLive,
    Layer.provide(InterestLearnerLive, Layer.empty)
  )
)

export type RecommendationAutoLayer = typeof RecommendationAuto
