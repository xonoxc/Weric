import { Effect, Layer, pipe } from "effect"
import {
  Database,
  StoryRepository,
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

export function createRecomputeScoresHandler(db: Db): JobHandler {
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
    Layer.provide(StoryRepositoryLive, DatabaseLayer),
    Layer.provide(UserRepositoryLive, DatabaseLayer)
  )

  return {
    type: "recompute_scores",

    handle() {
      return pipe(
        Effect.gen(function* () {
          const storyRepo = yield* StoryRepository
          const recommendationService = yield* RecommendationService
          const userRepo = yield* UserRepository

          const { data: stories } = yield* storyRepo.findPublishedFeed({
            page: 1,
            limit: 100,
          })

          const users = yield* userRepo.findAll()

          let totalRanked = 0

          yield* Effect.forEach(
            users,
            user =>
              pipe(
                recommendationService.generateFeed(user.id, {
                  limit: 50,
                }),
                Effect.catchAll(() => Effect.succeed(null)),
                Effect.tap(feed => {
                  if (feed) totalRanked += feed.data.length
                })
              ),
            { concurrency: 10 }
          )

          if (users.length > 0) {
            yield* Effect.logInfo("Recomputed resources", {
              stories: stories.length,
              users: users.length,
              totalRanked,
            })
          }
        }),
        Effect.provide(RecommendationLayer)
      )
    },
  }
}
