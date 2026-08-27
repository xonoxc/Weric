import { Hono } from "hono"
import { Effect, Layer } from "effect"
import { StoryRepositoryLive, EvidenceRepositoryLive } from "@weric/database"
import {
  StoryController,
  StoryControllerLive,
} from "~api/controllers/story.controller"
import { StoryServiceLive } from "~api/services/story.service"
import { buildRouteContext, effectHandler } from "~api/lib/handler"
import type { AppContext } from "~api/lib/app-context"

import type { ApiVariables } from "~api/app.ts"

export function createStoriesRoutes(base: AppContext) {
  const router = new Hono<{ Variables: ApiVariables }>()

  const routeContext = buildRouteContext(
    StoryControllerLive.pipe(
      Layer.provide(StoryServiceLive),
      Layer.provide(Layer.mergeAll(StoryRepositoryLive, EvidenceRepositoryLive))
    ),
    base
  )

  router.get(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* StoryController
          return yield* controller.list(ctx)
        }),
      routeContext
    )
  )

  router.get(
    "/:slug",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* StoryController
          return yield* controller.getBySlug(ctx)
        }),
      routeContext
    )
  )

  router.post(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* StoryController
          return yield* controller.createEvidence(ctx)
        }),
      routeContext
    )
  )

  return router
}
