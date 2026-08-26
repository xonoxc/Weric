import { Effect, Layer } from "effect"
import {
  StoryRepositoryLive,
  InterestRepositoryLive,
  InteractionRepository,
  InteractionRepositoryLive,
  UserRepository,
  UserRepositoryLive,
} from "@weric/database"
import {
  RecommendationService,
  RecommendationAuto,
  InterestLearner,
  InterestLearnerLive,
} from "@weric/recommendation"

import type { Db } from "@weric/database"
import type { JobHandler } from "~worker/runtime.ts"

export function createLearnInterestsHandler(db: Db): JobHandler {
  const RecommendationLayer = Layer.mergeAll(
    Layer.provide(
      RecommendationAuto,
      Layer.mergeAll(
        StoryRepositoryLive(db),
        InterestRepositoryLive(db),
        InteractionRepositoryLive(db)
      )
    ),
    InteractionRepositoryLive(db),
    Layer.provide(InterestLearnerLive, InterestRepositoryLive(db)),
    UserRepositoryLive(db)
  )

  return {
    type: "learn_interests",

    handle(
      _payload: Record<string, unknown>,
      _jobId: string
    ): Effect.Effect<void, unknown> {
      return Effect.gen(function* () {
        const interactionRepo = yield* InteractionRepository
        const recommendationService = yield* RecommendationService
        const interestLearner = yield* InterestLearner
        const userRepo = yield* UserRepository

        const users = yield* userRepo.findAll()

        for (const user of users) {
          const interactions = yield* interactionRepo.findByUser(user.id)

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

          yield* interestLearner.decayAll(user.id)
        }
      }).pipe(Effect.provide(RecommendationLayer))
    },
  }
}
