import { Effect } from "effect"
import {
  StoryRepository,
  InterestRepository,
  InteractionRepository,
  UserRepository,
} from "@weric/database"
import { RecommendationService } from "@weric/recommendation"
import type { JobHandler } from "../runtime.ts"

export function createRebuildRecommendationsHandler(
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
    type: "rebuild_recommendations",

    handle(
      _payload: Record<string, unknown>,
      jobId: string
    ): Effect.Effect<void, Error> {
      return Effect.gen(function* () {
        const users = yield* Effect.tryPromise({
          try: () => Effect.runPromise(userRepo.findAll()),
          catch: (cause: unknown) =>
            new Error(`Failed to fetch users: ${cause}`),
        })

        let totalStories = 0
        for (const user of users) {
          const feed = yield* Effect.tryPromise({
            try: () =>
              Effect.runPromise(
                recommendationService.generateFeed(user.id, { limit: 100 })
              ),
            catch: (cause: unknown) =>
              new Error(`Failed to generate feed: ${cause}`),
          }).pipe(Effect.catchAll(() => Effect.succeed(null)))

          if (feed) {
            totalStories += feed.data.length
          }
        }

        console.log(
          `[${jobId}] Rebuilt recommendations for ${users.length} users (${totalStories} total stories)`
        )
      })
    },
  }
}
