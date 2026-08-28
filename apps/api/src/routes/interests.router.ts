import { Hono } from "hono"
import { Effect, Layer } from "effect"
import { InterestRepositoryLive } from "@weric/database"

import type { ApiVariables } from "~api/app.ts"
import {
  InterestController,
  InterestControllerLive,
} from "~api/controllers/interest.controller"
import { InterestServiceLive } from "~api/services/interest.service"
import { buildRouteContext, effectHandler } from "~api/lib/handler"
import type { AppContext } from "~api/lib/app-context"

export function createInterestsRoutes(base: AppContext) {
  const router = new Hono<{ Variables: ApiVariables }>()

  const routeContext = buildRouteContext(
    InterestControllerLive.pipe(
      Layer.provide(InterestServiceLive),
      Layer.provide(InterestRepositoryLive)
    ),
    base
  )

  router.get(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* InterestController
          return yield* controller.get(ctx)
        }),
      routeContext
    )
  )

  router.post(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* InterestController
          return yield* controller.set(ctx)
        }),
      routeContext
    )
  )

  return router
}
