import { Hono } from "hono"
import { Effect, Layer } from "effect"
import { BookmarkRepositoryLive } from "@weric/database"
import {
  BookmarkController,
  BookmarkControllerLive,
} from "~api/controllers/bookmark.controller"
import { BookmarkServiceLive } from "~api/services/bookmark.service"
import { buildRouteContext, effectHandler } from "~api/lib/handler"
import type { AppContext } from "~api/lib/app-context"

import type { ApiVariables } from "~api/app.ts"

export function createBookmarksRoutes(base: AppContext) {
  const router = new Hono<{ Variables: ApiVariables }>()

  const routeContext = buildRouteContext(
    BookmarkControllerLive.pipe(
      Layer.provide(BookmarkServiceLive),
      Layer.provide(BookmarkRepositoryLive)
    ),
    base
  )

  router.get(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* BookmarkController
          return yield* controller.list(ctx)
        }),
      routeContext
    )
  )

  router.post(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* BookmarkController
          return yield* controller.create(ctx)
        }),
      routeContext
    )
  )

  router.delete(
    "/:storyId",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* BookmarkController
          return yield* controller.remove(ctx)
        }),
      routeContext
    )
  )

  return router
}
