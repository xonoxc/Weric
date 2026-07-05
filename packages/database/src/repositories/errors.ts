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
