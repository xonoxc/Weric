import { Hono } from "hono"
import { Effect, Layer } from "effect"
import { JobRepositoryLive } from "@weric/database"
import {
  EventController,
  EventControllerLive,
} from "~api/controllers/event.controller"
import { JobServiceLive } from "~api/services/job.service"
import { DatabaseLive } from "~db/connection"
import { effectHandler } from "~api/lib/handler"

import type { ApiVariables } from "~api/app.ts"

export function createEventsRoutes() {
  const router = new Hono<{ Variables: ApiVariables }>()

  const APILive = EventControllerLive.pipe(
    Layer.provide(JobServiceLive),
    Layer.provide(JobRepositoryLive),
    Layer.provide(DatabaseLive)
  )

  router.get(
    "/jobs/:id",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* EventController
          return yield* controller.getJob(ctx)
        }),
      APILive
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
      APILive
    )
  )

  return router
}
