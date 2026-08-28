import { Hono } from "hono"
import { Effect, Layer } from "effect"
import { JobRepositoryLive } from "@weric/database"
import {
  WorkerController,
  WorkerControllerLive,
} from "~api/controllers/worker.controller"
import { JobServiceLive } from "~api/services/job.service"
import { buildRouteContext, effectHandler } from "~api/lib/handler"
import type { AppContext } from "~api/lib/app-context"

import type { ApiVariables } from "~api/app.ts"

export function createWorkerRoutes(base: AppContext) {
  const router = new Hono<{ Variables: ApiVariables }>()

  const routeContext = buildRouteContext(
    WorkerControllerLive.pipe(
      Layer.provide(JobServiceLive),
      Layer.provide(JobRepositoryLive)
    ),
    base
  )

  router.get(
    "/worker/events",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* WorkerController
          return yield* controller.streamEvents(ctx)
        }),
      routeContext
    )
  )

  router.post(
    "/job-progress",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* WorkerController
          return yield* controller.jobProgress(ctx)
        }),
      routeContext
    )
  )

  return router
}
