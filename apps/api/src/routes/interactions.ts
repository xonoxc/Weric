import { Hono } from "hono"
import { Effect, Layer } from "effect"
import {
  StoryRepositoryLive,
  InteractionRepositoryLive,
  InterestRepositoryLive,
} from "@weric/database"
import { RecommendationAuto } from "@weric/recommendation"
import {
  InteractionController,
  InteractionControllerLive,
} from "~api/controllers/interaction.controller"
import { InteractionServiceLive } from "~api/services/interaction.service"
import { DatabaseLive } from "~db/connection"
import { effectHandler } from "~api/lib/handler"

import type { ApiVariables } from "~api/app.ts"

export function createInteractionsRoutes() {
  const router = new Hono<{ Variables: ApiVariables }>()

  const APILive = InteractionControllerLive.pipe(
    Layer.provide(InteractionServiceLive),
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

  router.post(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* InteractionController
          return yield* controller.create(ctx)
        }),
      APILive
    )
  )

  return router
}
