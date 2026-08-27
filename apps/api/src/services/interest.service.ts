import { Context, Data, Effect, Layer } from "effect"
import { Interest } from "packages/contracts/src"
import { InterestRepository } from "~db/repositories"

export class InterestError extends Data.TaggedError("InterestError")<{
  cause: unknown
}> {}

export interface InterestServiceShape {
  readonly getUserInterests: (
    userId: string
  ) => Effect.Effect<Interest[], InterestError>

  readonly setInterests: (
    userId: string,
    topics: string[]
  ) => Effect.Effect<Interest[], InterestError>
}

export class InterestService extends Context.Tag("InterestService")<
  InterestService,
  InterestServiceShape
>() {}

export const InterestServiceLive = Layer.effect(
  InterestService,
  Effect.gen(function* () {
    const repo = yield* InterestRepository

    return {
      getUserInterests: userId =>
        repo
          .findByUserId(userId)
          .pipe(Effect.mapError(error => new InterestError({ cause: error }))),

      setInterests: (userId, topics) =>
        Effect.gen(function* () {
          for (const topic of topics) {
            yield* repo.upsert(userId, topic, 1.0)
          }

          return yield* repo.findByUserId(userId)
        }).pipe(
          Effect.mapError(
            error =>
              new InterestError({
                cause: error,
              })
          )
        ),
    }
  })
)
