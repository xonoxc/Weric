import { Hono } from "hono"
import { Effect } from "effect"
import { InterestRepository, InterestRepositoryLive } from "@weric/database"
import { serviceFromLayer } from "~api/lib/layers.ts"
import { CreateInterestsRequestSchema } from "@weric/contracts"
import { requireUser } from "~api/lib/validation.ts"

import type { Db } from "@weric/database"
import type { ApiVariables } from "~api/app.ts"

export function createInterestsRoutes(db: Db) {
  const router = new Hono<{ Variables: ApiVariables }>()
  const interestRepo = serviceFromLayer(
    InterestRepository,
    InterestRepositoryLive(db)
  )

  router.get("/", async c => {
    const user = requireUser(c)

    const data = await Effect.runPromise(interestRepo.findByUserId(user.id))

    return c.json({ data })
  })

  router.post("/", async c => {
    const user = requireUser(c)
    const { topics } = CreateInterestsRequestSchema.parse(await c.req.json())

    for (const topic of topics) {
      await Effect.runPromise(interestRepo.upsert(user.id, topic, 1.0))
    }

    const data = await Effect.runPromise(interestRepo.findByUserId(user.id))

    return c.json({ data }, 201)
  })

  return router
}
