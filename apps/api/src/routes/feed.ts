import { Hono } from "hono"
import { Effect } from "effect"
import { StoryRepository } from "@weric/database"
import type { Db } from "@weric/database"
import type { ApiVariables } from "../index.ts"

export function createFeedRoutes(db: Db) {
  const router = new Hono<{ Variables: ApiVariables }>()
  const storyRepo = new StoryRepository(db)

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

    const { data, total } = await Effect.runPromise(
      storyRepo.findPublishedFeed({ page, limit })
    )

    return c.json({
      data: data.map(r => ({
        story: r,
        score: r.confidence,
        // TODO: populate reason from RecommendationEngine once implemented
        reason: undefined as string | undefined,
      })),
      meta: { page, limit, total },
    })
  })

  return router
}
