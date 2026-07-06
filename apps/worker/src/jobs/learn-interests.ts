import { Effect } from "effect"
import {
  StoryRepository,
  InterestRepository,
  InteractionRepository,
  UserRepository,
} from "@weric/database"
import { RecommendationService } from "@weric/recommendation"
import type { JobHandler } from "../runtime.ts"

export function createLearnInterestsHandler(
  storyRepo: StoryRepository,
  interestRepo: InterestRepository,
  interactionRepo: InteractionRepository,
  userRepo: UserRepository
): JobHandler {
  const recommendationService = new RecommendationService(
    storyRepo,
    interestRepo,
    interactionRepo
  )

  return {
    type: "learn_interests",

    handle(
      _payload: Record<string, unknown>,
      _jobId: string
    ): Effect.Effect<void, Error> {
      return Effect.gen(function* () {
        const users = yield* Effect.tryPromise({
          try: () => Effect.runPromise(userRepo.findAll()),
          catch: (cause: unknown) =>
            new Error(`Failed to fetch users: ${String(cause)}`),
        })

        for (const user of users) {
          const interactions = yield* Effect.tryPromise({
            try: () => Effect.runPromise(interactionRepo.findByUser(user.id)),
            catch: (cause: unknown) =>
              new Error(`Failed to fetch interactions: ${String(cause)}`),
          })

          const recentInteractions = interactions.filter(
            (i: { createdAt: Date }) => {
              const age = Date.now() - new Date(i.createdAt).getTime()
              return age < 86_400_000
            }
          )

          const uniqueStories = new Set(
            recentInteractions.map((i: { storyId: string }) => i.storyId)
          )

          for (const storyId of uniqueStories) {
            const storyInteractions = recentInteractions.filter(
              (i: { storyId: string }) => i.storyId === storyId
            )
            for (const interaction of storyInteractions) {
              yield* recommendationService.updateInterests(
                user.id,
                storyId,
                interaction.interactionType
              )
            }
          }

          yield* recommendationService.interestLearner.decayAll(user.id)
        }
      })
    },
  }
}
