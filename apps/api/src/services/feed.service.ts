import { Context, Effect, Layer } from "effect"
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

export class FeedService extends Context.Tag("FeedService")<
  FeedService,
  FeedServiceShape
>() {}

export const FeedServiceLive = Layer.effect(
  FeedService,
  Effect.gen(function* () {
    const recommendationService = yield* RecommendationService

    return {
      generateFeed: (userId, options) =>
        recommendationService.generateFeed(userId, options),
    }
  })
)
