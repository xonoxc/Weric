import { Hono } from "hono"
import { Effect } from "effect"
import {
  HealthController,
  HealthControllerLive,
} from "~api/controllers/health.controller"
import { buildRouteContext, effectHandler } from "~api/lib/handler"
import type { AppContext } from "~api/lib/app-context"

import type { ApiVariables } from "~api/app.ts"

export function createHealthRoutes(base: AppContext) {
  const router = new Hono<{ Variables: ApiVariables }>()

  const routeContext = buildRouteContext(HealthControllerLive, base)

  router.get(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* HealthController
          return yield* controller.check(ctx)
        }),
      routeContext
    )
  )

  return router
}
