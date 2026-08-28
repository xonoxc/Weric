import { Hono } from "hono"
import { Effect, Layer } from "effect"
import {
  StoryRepositoryLive,
  EvidenceRepositoryLive,
  JobRepositoryLive,
  ChatRepositoryLive,
} from "@weric/database"
import {
  SearchController,
  SearchControllerLive,
} from "~api/controllers/search.controller"
import { SearchServiceLive } from "~api/services/search.service"
import { buildRouteContext, effectHandler } from "~api/lib/handler"
import type { AppContext } from "~api/lib/app-context"

import type { ApiVariables } from "~api/app.ts"

export function createSearchRoutes(base: AppContext) {
  const router = new Hono<{ Variables: ApiVariables }>()

  const routeContext = buildRouteContext(
    SearchControllerLive.pipe(
      Layer.provide(SearchServiceLive),
      Layer.provide(
        Layer.mergeAll(
          StoryRepositoryLive,
          EvidenceRepositoryLive,
          JobRepositoryLive,
          ChatRepositoryLive
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
          const controller = yield* SearchController
          return yield* controller.search(ctx)
        }),
      routeContext
    )
  )

  return router
}
