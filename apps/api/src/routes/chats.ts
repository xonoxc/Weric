import { Hono } from "hono"
import { Effect, Layer } from "effect"
import { ChatRepositoryLive } from "@weric/database"
import {
  ChatController,
  ChatControllerLive,
} from "~api/controllers/chat.controller"
import { ChatServiceLive } from "~api/services/chat.service"
import { DatabaseLive } from "~db/connection"
import { effectHandler } from "~api/lib/handler"

import type { ApiVariables } from "~api/app.ts"

export function createChatRoutes() {
  const router = new Hono<{ Variables: ApiVariables }>()

  const APILive = ChatControllerLive.pipe(
    Layer.provide(ChatServiceLive),
    Layer.provide(ChatRepositoryLive),
    Layer.provide(DatabaseLive)
  )

  router.get(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* ChatController
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
          const controller = yield* ChatController
          return yield* controller.create(ctx)
        }),
      APILive
    )
  )

  router.get(
    "/:id",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* ChatController
          return yield* controller.getById(ctx)
        }),
      APILive
    )
  )

  router.delete(
    "/:id",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* ChatController
          return yield* controller.remove(ctx)
        }),
      APILive
    )
  )

  return router
}
