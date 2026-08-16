import { Hono } from "hono"
import { Effect } from "effect"
import { RecommendationService } from "@weric/recommendation"
import {
  InteractionRepository,
  StoryRepository,
  InterestRepository,
} from "@weric/database"
import { CreateInteractionInputSchema, InteractionType } from "@weric/contracts"
import { z } from "zod"
import { IsoDateString, requireUser } from "~api/lib/validation.ts"

import type { Db } from "@weric/database"
import type { ApiVariables } from "~api/app.ts"

const InteractionResponse = z.object({
  id: z.string(),
  userId: z.string(),
  storyId: z.string(),
  interactionType: InteractionType,
  duration: z
    .number()
    .nullable()
    .transform(value => value ?? undefined),
  createdAt: IsoDateString,
})

export function createInteractionsRoutes(db: Db) {
  const router = new Hono<{ Variables: ApiVariables }>()
  const interactionRepo = new InteractionRepository(db)

  const recommendationService = new RecommendationService(
    new StoryRepository(db),
    new InterestRepository(db),
    interactionRepo
  )

  router.post("/", async c => {
    const user = requireUser(c)
    const body = CreateInteractionInputSchema.parse(await c.req.json())

    const result = await Effect.runPromise(
      interactionRepo.create({ userId: user.id, ...body })
    )

    await Effect.runPromise(
      recommendationService.updateInterests(
        user.id,
        body.storyId,
        body.interactionType
      )
    )

    return c.json(InteractionResponse.parse(result), 201)
  })

  return router
}
