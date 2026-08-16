import { Hono } from "hono"
import { Effect } from "effect"
import { InterestRepository } from "@weric/database"
import type { Db } from "@weric/database"
import type { ApiVariables } from "../index.ts"

export function createInterestsRoutes(db: Db) {
  const router = new Hono<{ Variables: ApiVariables }>()
  const interestRepo = new InterestRepository(db)

  router.get("/", async c => {
    const user = c.get("user")
    if (!user) {
      return c.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        401
      )
    }

    const data = await Effect.runPromise(interestRepo.findByUserId(user.id))

    return c.json({ data })
  })

  router.post("/", async c => {
    const user = c.get("user")
    if (!user) {
      return c.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        401
      )
    }

    const body = await c.req.json()
    const topics = body.topics

    if (!Array.isArray(topics)) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "topics must be an array of strings",
          },
        },
        400
      )
    }

    const uniqueTopics = [...new Set(topics.filter(t => typeof t === "string"))]

    const results: Array<{ id: string; topic: string; score: number }> = []
    for (const topic of uniqueTopics) {
      await Effect.runPromise(interestRepo.upsert(user.id, topic, 1.0))
    }

    const data = await Effect.runPromise(interestRepo.findByUserId(user.id))

    return c.json({ data }, 201)
  })

  return router
}
