import { Hono } from "hono"
import { Effect, Layer } from "effect"
import {
  RecommendationService,
  RecommendationAuto,
} from "@weric/recommendation"
import {
  StoryRepositoryLive,
  InterestRepositoryLive,
  InteractionRepository,
  InteractionRepositoryLive,
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

  const InteractionLayer = InteractionRepositoryLive(db)

  const RecommendationLayer = Layer.provide(
    RecommendationAuto,
    Layer.mergeAll(
      StoryRepositoryLive(db),
      InterestRepositoryLive(db),
      InteractionRepositoryLive(db)
    )
  )

  router.post("/", async c => {
    const user = requireUser(c)
    const body = CreateInteractionInputSchema.parse(await c.req.json())

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const interactionRepo = yield* InteractionRepository
        return yield* interactionRepo.create({
          userId: user.id,
          ...body,
        })
      }).pipe(Effect.provide(InteractionLayer))
    )

    await Effect.runPromise(
      Effect.gen(function* () {
        const recommendationService = yield* RecommendationService
        yield* recommendationService.updateInterests(
          user.id,
          body.storyId,
          body.interactionType
        )
      }).pipe(Effect.provide(RecommendationLayer))
    )

    return c.json(InteractionResponse.parse(result), 201)
  })

  return router
}
