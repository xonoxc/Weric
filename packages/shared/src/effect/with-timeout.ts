import { Effect, Duration, Cause } from "effect"

export function withTimeout<A, E>(
  effect: Effect.Effect<A, E>,
  duration: Duration.DurationInput
): Effect.Effect<A, E | Cause.TimeoutException> {
  return Effect.timeout(effect, Duration.decode(duration))
}

export function withTimeoutFail<A, E, E2>(
  effect: Effect.Effect<A, E>,
  duration: Duration.DurationInput,
  onTimeout: () => E2
): Effect.Effect<A, E | E2> {
  return Effect.timeoutFail(effect, {
    duration: Duration.decode(duration),
    onTimeout,
  })
}
