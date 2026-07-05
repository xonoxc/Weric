import { Data } from "effect"

export class ProviderError extends Data.TaggedError("ProviderError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

export class RateLimitError extends Data.TaggedError("RateLimitError")<{
  readonly message: string
  readonly retryAfter?: number
}> {}

export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  readonly message: string
}> {}

export class UnsupportedFeatureError extends Data.TaggedError("UnsupportedFeatureError")<{
  readonly feature: string
  readonly message: string
}> {}

export type AIError =
  | ProviderError
  | ValidationError
  | RateLimitError
  | TimeoutError
  | UnsupportedFeatureError
