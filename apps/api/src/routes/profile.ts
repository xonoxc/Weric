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
import { buildRouteContext, effectHandler } from "~api/lib/handler"
import type { AppContext } from "~api/lib/app-context"

import type { ApiVariables } from "~api/app.ts"

export function createProfileRoutes(base: AppContext) {
  const router = new Hono<{ Variables: ApiVariables }>()

  const routeContext = buildRouteContext(
    ProfileControllerLive.pipe(
      Layer.provide(ProfileServiceLive),
      Layer.provide(
        Layer.mergeAll(
          BookmarkRepositoryLive,
          ChatRepositoryLive,
          InterestRepositoryLive,
          InteractionRepositoryLive
        )
      )
    ),
    base
  )

  router.get(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* ProfileController
          return yield* controller.get(ctx)
        }),
      routeContext
    )
  )

  return router
}
