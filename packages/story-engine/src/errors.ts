import { Data } from "effect"

export class NormalizationError extends Data.TaggedError("NormalizationError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

export class DuplicateEvidenceError extends Data.TaggedError("DuplicateEvidenceError")<{
  readonly url: string
}> {}

export class MatchError extends Data.TaggedError("MatchError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

export class ExtractionError extends Data.TaggedError("ExtractionError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

export class MergeError extends Data.TaggedError("MergeError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

export class StoryNotFoundError extends Data.TaggedError("StoryNotFoundError")<{
  readonly storyId: string
}> {}

export class ServiceError extends Data.TaggedError("ServiceError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

export type StoryError =
  | NormalizationError
  | DuplicateEvidenceError
  | MatchError
  | ExtractionError
  | MergeError
  | StoryNotFoundError
  | ServiceError
