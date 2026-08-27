import { Hono } from "hono"
import { Effect, Layer } from "effect"
import { JobRepositoryLive } from "@weric/database"
import {
  WorkerController,
  WorkerControllerLive,
} from "~api/controllers/worker.controller"
import { JobServiceLive } from "~api/services/job.service"
import { DatabaseLive } from "~db/connection"
import { effectHandler } from "~api/lib/handler"

import type { ApiVariables } from "~api/app.ts"

export function createWorkerRoutes() {
  const router = new Hono<{ Variables: ApiVariables }>()

  const APILive = WorkerControllerLive.pipe(
    Layer.provide(JobServiceLive),
    Layer.provide(JobRepositoryLive),
    Layer.provide(DatabaseLive)
  )

  router.get(
    "/worker/events",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* WorkerController
          return yield* controller.streamEvents(ctx)
        }),
      APILive
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
      APILive
    )
  )

  return router
}
