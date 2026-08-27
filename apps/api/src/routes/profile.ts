import { Hono } from "hono"
import { Effect, Layer } from "effect"
import {
  BookmarkRepositoryLive,
  ChatRepositoryLive,
  InterestRepositoryLive,
  InteractionRepositoryLive,
} from "@weric/database"
import {
  ProfileController,
  ProfileControllerLive,
} from "~api/controllers/profile.controller"
import { ProfileServiceLive } from "~api/services/profile.service"
import { DatabaseLive } from "~db/connection"
import { effectHandler } from "~api/lib/handler"

import type { ApiVariables } from "~api/app.ts"

export function createProfileRoutes() {
  const router = new Hono<{ Variables: ApiVariables }>()

  const APILive = ProfileControllerLive.pipe(
    Layer.provide(ProfileServiceLive),
    Layer.provide(
      Layer.mergeAll(
        BookmarkRepositoryLive,
        ChatRepositoryLive,
        InterestRepositoryLive,
        InteractionRepositoryLive
      )
    ),
    Layer.provide(DatabaseLive)
  )

  router.get(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* ProfileController
          return yield* controller.get(ctx)
        }),
      APILive
    )
  )

  return router
}
