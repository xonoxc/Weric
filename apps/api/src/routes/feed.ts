import { Hono } from "hono"
import { Effect, Layer } from "effect"
import {
  RecommendationService,
  RecommendationAuto,
} from "@weric/recommendation"
import {
  StoryRepositoryLive,
  InterestRepositoryLive,
  InteractionRepositoryLive,
} from "@weric/database"
import { PaginationQuery, requireUser } from "~api/lib/validation.ts"

import type { Db } from "@weric/database"
import type { ApiVariables } from "~api/app.ts"

const FeedQuery = PaginationQuery(50)

export function createFeedRoutes(db: Db) {
  const router = new Hono<{ Variables: ApiVariables }>()

  const RecommendationLayer = Layer.provide(
    RecommendationAuto,
    Layer.mergeAll(
      StoryRepositoryLive(db),
      InterestRepositoryLive(db),
      InteractionRepositoryLive(db)
    )
  )

  router.get("/", async c => {
    const user = requireUser(c)
    const { page, limit } = FeedQuery.parse(c.req.query())

    const feed = await Effect.runPromise(
      Effect.gen(function* () {
        const recommendationService = yield* RecommendationService
        return yield* recommendationService.generateFeed(user.id, {
          page,
          limit,
        })
      }).pipe(Effect.provide(RecommendationLayer))
    )

    return c.json(feed)
  })

  return router
}
