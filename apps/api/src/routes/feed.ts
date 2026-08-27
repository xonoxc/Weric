import { Hono } from "hono"
import { Effect, Layer } from "effect"
import {
  StoryRepositoryLive,
  InteractionRepositoryLive,
  InterestRepositoryLive,
} from "@weric/database"
import { RecommendationAuto } from "@weric/recommendation"
import {
  FeedController,
  FeedControllerLive,
} from "~api/controllers/feed.controller"
import { FeedServiceLive } from "~api/services/feed.service"
import { DatabaseLive } from "~db/connection"
import { effectHandler } from "~api/lib/handler"

import type { ApiVariables } from "~api/app.ts"

export function createFeedRoutes() {
  const router = new Hono<{ Variables: ApiVariables }>()

  const APILive = FeedControllerLive.pipe(
    Layer.provide(FeedServiceLive),
    Layer.provide(RecommendationAuto),
    Layer.provide(
      Layer.mergeAll(
        StoryRepositoryLive,
        InteractionRepositoryLive,
        InterestRepositoryLive
      )
    ),
    Layer.provide(DatabaseLive)
  )

  router.get(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* FeedController
          return yield* controller.generate(ctx)
        }),
      APILive
    )
  )

  return router
}
