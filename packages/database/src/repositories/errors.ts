import { Effect } from "effect"

export class NotFoundError {
  readonly _tag = "NotFoundError"
  constructor(
    readonly entity: string,
    readonly id: string
  ) {}
}

export class ConflictError {
  readonly _tag = "ConflictError"
  constructor(readonly message: string) {}
}

export class ConnectionError {
  readonly _tag = "ConnectionError"
  constructor(readonly cause: unknown) {}
}

export type RepositoryError = NotFoundError | ConflictError | ConnectionError

export const tryDb = <T>(
  fn: () => Promise<T>
): Effect.Effect<T, RepositoryError> =>
  Effect.tryPromise({
    try: fn,
    catch: (cause): RepositoryError => {
      if (cause instanceof NotFoundError) return cause
      if (cause instanceof ConflictError) return cause
      return new ConnectionError(cause)
    },
  })
