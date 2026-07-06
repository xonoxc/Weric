import { Effect } from "effect"
import {
  StoryRepository,
  InterestRepository,
  InteractionRepository,
  UserRepository,
} from "@weric/database"
import { RecommendationService } from "@weric/recommendation"
import type { JobHandler } from "../runtime.ts"

export function createRecomputeScoresHandler(
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
    type: "recompute_scores",

    handle(
      _payload: Record<string, unknown>,
      _jobId: string
    ): Effect.Effect<void, Error> {
      return Effect.gen(function* () {
        const { data: stories } = yield* Effect.tryPromise({
          try: () =>
            Effect.runPromise(
              storyRepo.findPublishedFeed({ page: 1, limit: 100 })
            ),
          catch: (cause: unknown) =>
            new Error(`Failed to fetch stories: ${cause}`),
        })

        const users = yield* Effect.tryPromise({
          try: () => Effect.runPromise(userRepo.findAll()),
          catch: (cause: unknown) =>
            new Error(`Failed to fetch users: ${cause}`),
        })

        for (const user of users.slice(0, 10)) {
          const feed = yield* Effect.tryPromise({
            try: () =>
              Effect.runPromise(
                recommendationService.generateFeed(user.id, { limit: 50 })
              ),
            catch: (cause: unknown) =>
              new Error(`Failed to generate feed: ${cause}`),
          }).pipe(Effect.catchAll(() => Effect.succeed(null)))

          if (feed) {
            console.log(
              `Recomputed scores for user ${user.id}: ${feed.data.length} stories`
            )
          }
        }
      })
    },
  }
}
