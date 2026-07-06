import { Data } from "effect"

export class FetchError extends Data.TaggedError("FetchError")<{
  readonly url: string
  readonly status?: number
  readonly message: string
}> {}

export class ParseError extends Data.TaggedError("ParseError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

export type BrowserError = FetchError | ParseError
