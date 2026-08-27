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
import { DatabaseLive } from "~db/connection"
import { effectHandler } from "~api/lib/handler"

import type { ApiVariables } from "~api/app.ts"

export function createSearchRoutes() {
  const router = new Hono<{ Variables: ApiVariables }>()

  const APILive = SearchControllerLive.pipe(
    Layer.provide(SearchServiceLive),
    Layer.provide(
      Layer.mergeAll(
        StoryRepositoryLive,
        EvidenceRepositoryLive,
        JobRepositoryLive,
        ChatRepositoryLive
      )
    ),
    Layer.provide(DatabaseLive)
  )

  router.get(
    "/",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* SearchController
          return yield* controller.search(ctx)
        }),
      APILive
    )
  )

  return router
}
