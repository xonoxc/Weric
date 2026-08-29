import { Schema } from "effect"

export const StoryStatus = Schema.Literal("draft", "published", "archived")
export type StoryStatus = Schema.Schema.Type<typeof StoryStatus>

export const StorySchema = Schema.Struct({
  id: Schema.UUID,
  title: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(500)),
  slug: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(500)),
  summary: Schema.optional(Schema.String),
  confidence: Schema.optional(
    Schema.Number.pipe(
      Schema.greaterThanOrEqualTo(0),
      Schema.lessThanOrEqualTo(1)
    )
  ).pipe(Schema.withDecodingDefault(() => 0)),
  status: Schema.optional(StoryStatus).pipe(
    Schema.withDecodingDefault(() => "draft" as const)
  ),
  createdAt: Schema.String,
  updatedAt: Schema.String,
})
export type Story = Schema.Schema.Type<typeof StorySchema>

export const CreateStoryInputSchema = Schema.Struct({
  title: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(500)),
  summary: Schema.optional(Schema.String),
  evidenceIds: Schema.optional(Schema.Array(Schema.UUID)).pipe(
    Schema.withDecodingDefault(() => [])
  ),
})
export type CreateStoryInput = Schema.Schema.Type<typeof CreateStoryInputSchema>

export const UpdateStoryInputSchema = Schema.Struct({
  title: Schema.optional(
    Schema.String.pipe(Schema.minLength(1), Schema.maxLength(500))
  ),
  summary: Schema.optional(Schema.String),
  status: Schema.optional(StoryStatus),
  confidence: Schema.optional(
    Schema.Number.pipe(
      Schema.greaterThanOrEqualTo(0),
      Schema.lessThanOrEqualTo(1)
    )
  ),
})
export type UpdateStoryInput = Schema.Schema.Type<typeof UpdateStoryInputSchema>

export const StorySummarySchema = Schema.Struct({
  id: Schema.UUID,
  title: Schema.String,
  slug: Schema.String,
  summary: Schema.optional(Schema.String),
  confidence: Schema.Number,
  status: StoryStatus,
  evidenceCount: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
  createdAt: Schema.String,
  updatedAt: Schema.String,
})
export type StorySummary = Schema.Schema.Type<typeof StorySummarySchema>
