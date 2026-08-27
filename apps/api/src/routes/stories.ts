import { Hono } from "hono"
import { Effect, Layer } from "effect"
import { StoryRepositoryLive, EvidenceRepositoryLive } from "@weric/database"
import {
  StoryController,
  StoryControllerLive,
} from "~api/controllers/story.controller"
import { StoryServiceLive } from "~api/services/story.service"
import { DatabaseLive } from "~db/connection"
import { effectHandler } from "~api/lib/handler"

import type { ApiVariables } from "~api/app.ts"

export function createStoriesRoutes() {
  const router = new Hono<{ Variables: ApiVariables }>()

  const APILive = StoryControllerLive.pipe(
    Layer.provide(StoryServiceLive),
    Layer.provide(Layer.mergeAll(StoryRepositoryLive, EvidenceRepositoryLive)),
    Layer.provide(DatabaseLive)
  )

  router.get(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* StoryController
          return yield* controller.list(ctx)
        }),
      APILive
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
      APILive
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
      APILive
    )
  )

  return router
}
