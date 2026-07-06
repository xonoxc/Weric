import { Hono } from "hono"
import { Effect } from "effect"
import { RecommendationService } from "@weric/recommendation"
import {
  StoryRepository,
  InterestRepository,
  InteractionRepository,
} from "@weric/database"
import type { Db } from "@weric/database"
import type { ApiVariables } from "../index.ts"

export function createFeedRoutes(db: Db) {
  const router = new Hono<{ Variables: ApiVariables }>()
  const recommendationService = new RecommendationService(
    new StoryRepository(db),
    new InterestRepository(db),
    new InteractionRepository(db)
  )

  router.get("/", async c => {
    const user = c.get("user")
    if (!user) {
      return c.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        401
      )
    }

    const page = Math.max(1, Number(c.req.query("page") ?? 1))
    const limit = Math.min(50, Math.max(1, Number(c.req.query("limit") ?? 20)))

    const feed = await Effect.runPromise(
      recommendationService.generateFeed(user.id, { page, limit })
    )

    return c.json(feed)
  })

  return router
}
