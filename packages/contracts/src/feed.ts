import { Schema } from "effect"
import { StorySummarySchema } from "./story.ts"

export const FeedItemSchema = Schema.Struct({
  story: StorySummarySchema,
  score: Schema.Number.pipe(
    Schema.greaterThanOrEqualTo(0),
    Schema.lessThanOrEqualTo(1)
  ),
  reason: Schema.optional(Schema.String),
})
export type FeedItem = Schema.Schema.Type<typeof FeedItemSchema>

export const FeedSchema = Schema.Struct({
  data: Schema.Array(FeedItemSchema),
  meta: Schema.Struct({
    page: Schema.Number.pipe(Schema.int(), Schema.positive()),
    limit: Schema.Number.pipe(Schema.int(), Schema.positive()),
    total: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
  }),
})
export type Feed = Schema.Schema.Type<typeof FeedSchema>

export const FeedOptionsSchema = Schema.Struct({
  page: Schema.optional(
    Schema.Number.pipe(Schema.int(), Schema.positive())
  ).pipe(Schema.withDecodingDefault(() => 1)),
  limit: Schema.optional(
    Schema.Number.pipe(
      Schema.int(),
      Schema.positive(),
      Schema.lessThanOrEqualTo(100)
    )
  ).pipe(Schema.withDecodingDefault(() => 20)),
})
export type FeedOptions = Schema.Schema.Type<typeof FeedOptionsSchema>
