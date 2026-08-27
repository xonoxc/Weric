import { Hono } from "hono"
import { Effect, Layer } from "effect"
import {
  HealthController,
  HealthControllerLive,
} from "~api/controllers/health.controller"
import { effectHandler } from "~api/lib/handler"

import type { ApiVariables } from "~api/app.ts"

export function createHealthRoutes() {
  const router = new Hono<{ Variables: ApiVariables }>()

  const APILive = HealthControllerLive

  router.get(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* HealthController
          return yield* controller.check(ctx)
        }),
      APILive
    )
  )

  return router
}
