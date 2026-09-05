import { Effect } from "effect"
import { RecommendationService } from "@weric/recommendation"
import type { FeedOptions } from "@weric/recommendation"

import type { Feed } from "@weric/contracts"
import type { RecommendationError } from "@weric/recommendation"

export interface FeedServiceShape {
  readonly generateFeed: (
    userId: string,
    options: FeedOptions
  ) => Effect.Effect<Feed, RecommendationError>
}

export class FeedService extends Effect.Service<FeedServiceShape>()(
  "FeedService",
  {
    effect: Effect.gen(function* () {
      const recommendationService = yield* RecommendationService

      return {
        generateFeed: (userId, options) =>
          recommendationService.generateFeed(userId, options),
      } satisfies FeedServiceShape
    }),
  }
) {}

export const FeedServiceLive = FeedService.Default
