import { Hono } from "hono"
import { Effect, Layer } from "effect"
import { BookmarkRepositoryLive } from "@weric/database"
import {
  BookmarkController,
  BookmarkControllerLive,
} from "~api/controllers/bookmark.controller"
import { BookmarkServiceLive } from "~api/services/bookmark.service"
import { DatabaseLive } from "~db/connection"
import { effectHandler } from "~api/lib/handler"

import type { ApiVariables } from "~api/app.ts"

export function createBookmarksRoutes() {
  const router = new Hono<{ Variables: ApiVariables }>()

  const APILive = BookmarkControllerLive.pipe(
    Layer.provide(BookmarkServiceLive),
    Layer.provide(BookmarkRepositoryLive),
    Layer.provide(DatabaseLive)
  )

  router.get(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* BookmarkController
          return yield* controller.list(ctx)
        }),
      APILive
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
      APILive
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
      APILive
    )
  )

  return router
}
