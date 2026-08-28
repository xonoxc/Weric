import { Hono } from "hono"
import { Effect, Layer } from "effect"
import { JobRepositoryLive } from "@weric/database"
import {
  EventController,
  EventControllerLive,
} from "~api/controllers/event.controller"
import { JobServiceLive } from "~api/services/job.service"
import { buildRouteContext, effectHandler } from "~api/lib/handler"
import type { AppContext } from "~api/lib/app-context"

import type { ApiVariables } from "~api/app.ts"

export function createEventsRoutes(base: AppContext) {
  const router = new Hono<{ Variables: ApiVariables }>()

  const routeContext = buildRouteContext(
    EventControllerLive.pipe(
      Layer.provide(JobServiceLive),
      Layer.provide(JobRepositoryLive)
    ),
    base
  )

  router.get(
    "/jobs/:id",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* EventController
          return yield* controller.getJob(ctx)
        }),
      routeContext
    )
  )

  router.get(
    "/events",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* EventController
          return yield* controller.streamEvents(ctx)
        }),
      routeContext
    )
  )

  return router
}
