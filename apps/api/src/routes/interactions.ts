import { Hono } from "hono"
import { Effect } from "effect"
import { RecommendationService } from "@weric/recommendation"
import {
  InteractionRepository,
  StoryRepository,
  InterestRepository,
} from "@weric/database"
import type { Db } from "@weric/database"
import type { ApiVariables } from "../index.ts"

export function createInteractionsRoutes(db: Db) {
  const router = new Hono<{ Variables: ApiVariables }>()
  const interactionRepo = new InteractionRepository(db)

  const recommendationService = new RecommendationService(
    new StoryRepository(db),
    new InterestRepository(db),
    interactionRepo
  )

  router.post("/", async c => {
    const user = c.get("user")
    if (!user) {
      return c.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        401
      )
    }

    const body = await c.req.json()
    if (!body.storyId || typeof body.storyId !== "string") {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "storyId is required and must be a string",
          },
        },
        400
      )
    }
    if (!body.interactionType || typeof body.interactionType !== "string") {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "interactionType is required and must be a string",
          },
        },
        400
      )
    }

    const result = await Effect.runPromise(
      interactionRepo.create({
        userId: user.id,
        storyId: body.storyId,
        interactionType: body.interactionType,
        duration: typeof body.duration === "number" ? body.duration : null,
      })
    )

    Effect.runPromise(
      recommendationService.updateInterests(
        user.id,
        body.storyId,
        body.interactionType
      )
    )

    return c.json(
      {
        id: result.id,
        userId: result.userId,
        storyId: result.storyId,
        interactionType: result.interactionType,
        duration: result.duration ?? undefined,
        createdAt:
          result.createdAt instanceof Date
            ? result.createdAt.toISOString()
            : String(result.createdAt),
      },
      201
    )
  })

  return router
}
