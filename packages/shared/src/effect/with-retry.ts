import { Effect, Schedule } from "effect"

export function withRetry<A, E>(
  effect: Effect.Effect<A, E>,
  options?: {
    maxRetries?: number
    delay?: number
  }
): Effect.Effect<A, E> {
  const { maxRetries = 3, delay = 500 } = options ?? {}
  const policy = Schedule.exponential(delay, 2.0).pipe(
    Schedule.compose(Schedule.recurs(maxRetries))
  )
  return Effect.retry(effect, policy)
}

export function withRetryWhile<A, E>(
  effect: Effect.Effect<A, E>,
  predicate: (error: E) => boolean,
  options?: {
    maxRetries?: number
    delay?: number
  }
): Effect.Effect<A, E> {
  const policy = Schedule.exponential(options?.delay ?? 500, 2.0).pipe(
    Schedule.compose(Schedule.recurs(options?.maxRetries ?? 3))
  )
  return effect.pipe(
    Effect.catchAll(error =>
      predicate(error) ? Effect.retry(effect, policy) : Effect.fail(error)
    )
  )
}
