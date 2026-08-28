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
import { buildRouteContext, effectHandler } from "~api/lib/handler"
import type { AppContext } from "~api/lib/app-context"

import type { ApiVariables } from "~api/app.ts"

export function createFeedRoutes(base: AppContext) {
  const router = new Hono<{ Variables: ApiVariables }>()

  const routeContext = buildRouteContext(
    FeedControllerLive.pipe(
      Layer.provide(FeedServiceLive),
      Layer.provide(RecommendationAuto),
      Layer.provide(
        Layer.mergeAll(
          StoryRepositoryLive,
          InteractionRepositoryLive,
          InterestRepositoryLive
        )
      )
    ),
    base
  )

  router.get(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* FeedController
          return yield* controller.generate(ctx)
        }),
      routeContext
    )
  )

  return router
}
