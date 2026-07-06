import { Data } from "effect"

export class NoStoriesError extends Data.TaggedError("NoStoriesError")<{
  readonly message: string
}> {}

export class ScoringError extends Data.TaggedError("ScoringError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

export type RecommendationError = NoStoriesError | ScoringError
