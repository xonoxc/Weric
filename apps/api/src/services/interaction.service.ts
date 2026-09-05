import { Effect } from "effect"
import { InteractionRepository } from "@weric/database"
import { RecommendationService } from "@weric/recommendation"

import type { RepositoryError } from "@weric/database"
import type { RecommendationError } from "@weric/recommendation"

import { interactions } from "~db/schema/tables.ts"

type InteractionRow = (typeof interactions)["$inferSelect"]

export interface CreateInteractionInput {
  userId: string
  storyId: string
  interactionType: string
  duration?: number | null
}

export interface InteractionServiceShape {
  readonly create: (
    input: CreateInteractionInput
  ) => Effect.Effect<InteractionRow, RepositoryError | RecommendationError>
}

export class InteractionService extends Effect.Service<InteractionServiceShape>()(
  "InteractionService",
  {
    effect: Effect.gen(function* () {
      const repo = yield* InteractionRepository
      const recommendationService = yield* RecommendationService

      return {
        create: input =>
          Effect.gen(function* () {
            const result = yield* repo.create({
              userId: input.userId,
              storyId: input.storyId,
              interactionType: input.interactionType,
              duration: input.duration ?? null,
            })

            yield* recommendationService.updateInterests(
              input.userId,
              input.storyId,
              input.interactionType
            )

            return result
          }),
      } satisfies InteractionServiceShape
    }),
  }
) {}

export const InteractionServiceLive = InteractionService.Default
