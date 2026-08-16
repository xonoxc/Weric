import { Hono } from "hono"
import { Effect } from "effect"
import { RecommendationService } from "@weric/recommendation"
import {
  StoryRepository,
  InterestRepository,
  InteractionRepository,
} from "@weric/database"
import { PaginationQuery, requireUser } from "~api/lib/validation.ts"

import type { Db } from "@weric/database"
import type { ApiVariables } from "~api/app.ts"

const FeedQuery = PaginationQuery(50)

export function createFeedRoutes(db: Db) {
  const router = new Hono<{ Variables: ApiVariables }>()
  const recommendationService = new RecommendationService(
    new StoryRepository(db),
    new InterestRepository(db),
    new InteractionRepository(db)
  )

  router.get("/", async c => {
    const user = requireUser(c)
    const { page, limit } = FeedQuery.parse(c.req.query())

    const feed = await Effect.runPromise(
      recommendationService.generateFeed(user.id, {
        page,
        limit,
      })
    )

    return c.json(feed)
  })

  return router
}
