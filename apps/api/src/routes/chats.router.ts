import { Hono } from "hono"
import { Effect, Layer } from "effect"
import { ChatRepositoryLive } from "@weric/database"
import {
  ChatController,
  ChatControllerLive,
} from "~api/controllers/chat.controller"
import { ChatServiceLive } from "~api/services/chat.service"
import { buildRouteContext, effectHandler } from "~api/lib/handler"
import type { AppContext } from "~api/lib/app-context"

import type { ApiVariables } from "~api/app.ts"

export function createChatRoutes(base: AppContext) {
  const router = new Hono<{ Variables: ApiVariables }>()

  const routeContext = buildRouteContext(
    ChatControllerLive.pipe(
      Layer.provide(ChatServiceLive),
      Layer.provide(ChatRepositoryLive)
    ),
    base
  )

  router.get(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* ChatController
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
          const controller = yield* ChatController
          return yield* controller.create(ctx)
        }),
      routeContext
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
      routeContext
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
      routeContext
    )
  )

  return router
}
