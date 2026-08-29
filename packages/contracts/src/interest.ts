import { Schema } from "effect"

export const InterestSchema = Schema.Struct({
  id: Schema.UUID,
  userId: Schema.UUID,
  topic: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
  score: Schema.optional(
    Schema.Number.pipe(
      Schema.greaterThanOrEqualTo(0),
      Schema.lessThanOrEqualTo(1)
    )
  ).pipe(Schema.withDecodingDefault(() => 0)),
  updatedAt: Schema.String,
})
export type Interest = Schema.Schema.Type<typeof InterestSchema>

export const CreateInterestInputSchema = Schema.Struct({
  topic: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
})
export type CreateInterestInput = Schema.Schema.Type<
  typeof CreateInterestInputSchema
>

export const InterestUpdateSchema = Schema.Struct({
  topic: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
  score: Schema.Number.pipe(
    Schema.greaterThanOrEqualTo(0),
    Schema.lessThanOrEqualTo(1)
  ),
})
export type InterestUpdate = Schema.Schema.Type<typeof InterestUpdateSchema>

export const CreateInterestsRequestSchema = Schema.Struct({
  topics: Schema.Array(
    Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200))
  ),
})
export type CreateInterestsRequest = Schema.Schema.Type<
  typeof CreateInterestsRequestSchema
>
