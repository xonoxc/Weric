import { Hono } from "hono"
import { Effect, Layer } from "effect"
import { InterestRepositoryLive } from "@weric/database"

import type { ApiVariables } from "~api/app.ts"
import {
  InterestController,
  InterestControllerLive,
} from "~api/controllers/interest.controller"
import { InterestServiceLive } from "~api/services/interest.service"
import { DatabaseLive } from "~db/connection"
import { effectHandler } from "~api/lib/handler"

export function createInterestsRoutes() {
  const router = new Hono<{ Variables: ApiVariables }>()

  const APILive = InterestControllerLive.pipe(
    Layer.provide(InterestServiceLive),
    Layer.provide(InterestRepositoryLive),
    Layer.provide(DatabaseLive)
  )

  router.get(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* InterestController
          return yield* controller.get(ctx)
        }),
      APILive
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
      APILive
    )
  )

  return router
}
