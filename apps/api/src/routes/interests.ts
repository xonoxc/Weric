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

  return router
}
