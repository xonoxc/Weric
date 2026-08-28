import { Effect, Layer } from "effect"
import {
  Database,
  StoryRepositoryLive,
  InterestRepositoryLive,
  InteractionRepositoryLive,
  UserRepository,
  UserRepositoryLive,
} from "@weric/database"
import {
  RecommendationService,
  RecommendationAuto,
} from "@weric/recommendation"

import type { Db } from "@weric/database"
import type { JobHandler } from "~worker/runtime.ts"

export function createRebuildRecommendationsHandler(db: Db): JobHandler {
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
    Layer.provide(UserRepositoryLive, DatabaseLayer)
  )

  return {
    type: "rebuild_recommendations",

    handle(_payload: Record<string, unknown>, jobId: string) {
      return Effect.gen(function* () {
        const recommendationService = yield* RecommendationService
        const userRepo = yield* UserRepository

        const users = yield* userRepo.findAll()

        let totalStories = 0
        let userCount = 0

        for (const user of users) {
          const feed = yield* recommendationService
            .generateFeed(user.id, { limit: 100 })
            .pipe(Effect.catchAll(() => Effect.succeed(null)))

          if (feed) {
            totalStories += feed.data.length
          }
          userCount += 1
        }

        console.log(
          `[${jobId}] Rebuilt recommendations for ${userCount} users (${totalStories} total stories)`
        )
      }).pipe(Effect.provide(RecommendationLayer))
    },
  }
}
