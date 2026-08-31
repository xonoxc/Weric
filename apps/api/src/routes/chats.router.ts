import { Hono } from "hono"
import { Effect, Layer } from "effect"
import {
  ChatRepositoryLive,
  ConceptRepositoryLive,
  ConceptEdgeRepositoryLive,
  ConceptStoryRepositoryLive,
} from "@weric/database"
import {
  ChatController,
  ChatControllerLive,
} from "~api/controllers/chat.controller"
import {
  GraphController,
  GraphControllerLive,
} from "~api/controllers/graph.controller"
import { ChatServiceLive } from "~api/services/chat.service"
import { GraphServiceLive } from "~api/services/graph.service"
import { buildRouteContext, effectHandler } from "~api/lib/handler"
import type { AppContext } from "~api/lib/app-context"

import type { ApiVariables } from "~api/app.ts"

export function createChatRoutes(base: AppContext) {
  const router = new Hono<{ Variables: ApiVariables }>()

  const graphRepoLayers = Layer.mergeAll(
    ConceptRepositoryLive,
    ConceptEdgeRepositoryLive,
    ConceptStoryRepositoryLive
  )

  const routeContext = buildRouteContext(
    Layer.mergeAll(
      ChatControllerLive.pipe(
        Layer.provide(ChatServiceLive),
        Layer.provide(ChatRepositoryLive)
      ),
      GraphControllerLive.pipe(
        Layer.provide(GraphServiceLive),
        Layer.provide(ChatServiceLive),
        Layer.provide(ChatRepositoryLive),
        Layer.provide(graphRepoLayers)
      )
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
    "/:id/graph",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* GraphController
          return yield* controller.getById(ctx)
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
