import { Effect, Layer } from "effect"
import {
  Database,
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
  const DatabaseLayer = Layer.succeed(Database, db)

  const RecommendationLayer = Layer.mergeAll(
    Layer.provide(
      RecommendationAuto,
      Layer.mergeAll(
        Layer.provide(StoryRepositoryLive, DatabaseLayer),
        Layer.provide(InterestRepositoryLive, DatabaseLayer),
        Layer.provide(InteractionRepositoryLive, DatabaseLayer)
      )
    ),
    Layer.provide(InteractionRepositoryLive, DatabaseLayer),
    Layer.provide(
      InterestLearnerLive,
      Layer.provide(InterestRepositoryLive, DatabaseLayer)
    ),
    Layer.provide(UserRepositoryLive, DatabaseLayer)
  )

  return {
    type: "learn_interests",

    handle() {
      return Effect.gen(function* () {
        const interactionRepo = yield* InteractionRepository
        const recommendationService = yield* RecommendationService
        const interestLearner = yield* InterestLearner
        const userRepo = yield* UserRepository

        const users = yield* userRepo.findAll()

        yield* Effect.forEach(
          users,
          user =>
            Effect.gen(function* () {
              const interactions = yield* interactionRepo.findByUser(user.id)

              const recentInteractions = interactions.filter(
                (i: { createdAt: Date }) => {
                  const age = Date.now() - new Date(i.createdAt).getTime()
                  return age < 86_400_000
                }
              )

              const groupedByStory = new Map<
                string,
                typeof recentInteractions
              >()

              for (const interaction of recentInteractions) {
                const list = groupedByStory.get(interaction.storyId)
                if (list) {
                  list.push(interaction)
                } else {
                  groupedByStory.set(interaction.storyId, [interaction])
                }
              }

              yield* Effect.forEach(
                [...groupedByStory.entries()],
                ([storyId, storyInteractions]) =>
                  Effect.forEach(
                    storyInteractions,
                    interaction =>
                      recommendationService.updateInterests(
                        user.id,
                        storyId,
                        interaction.interactionType
                      ),
                    { concurrency: 5 }
                  ),
                { concurrency: 3 }
              )

              yield* interestLearner.decayAll(user.id)
            }),
          { concurrency: 10 }
        )
      }).pipe(Effect.provide(RecommendationLayer))
    },
  }
}
