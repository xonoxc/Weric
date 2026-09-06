import { Effect } from "effect"
import { InteractionRepository } from "@weric/database"
import { RecommendationService } from "@weric/recommendation"

import type { RepositoryError } from "@weric/database"
import type { RecommendationError } from "@weric/recommendation"
import type { Optioned } from "@weric/utils"

import type { DbInteraction as DBInteractionRow } from "~db/schema/tables.ts"

export interface CreateInteractionInput {
  userId: string
  storyId: string
  interactionType: string
  duration: Optioned<number>
}

export interface InteractionServiceShape {
  readonly create: (
    input: CreateInteractionInput
  ) => Effect.Effect<DBInteractionRow, RepositoryError | RecommendationError>
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
              duration: input.duration,
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
