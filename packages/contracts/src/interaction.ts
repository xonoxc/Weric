import { Schema } from "effect"

export const InteractionType = Schema.Literal(
  "read",
  "read_complete",
  "click",
  "share",
  "hide",
  "save"
)

export const InteractionSchema = Schema.Struct({
  id: Schema.UUID,
  userId: Schema.UUID,
  storyId: Schema.UUID,
  interactionType: InteractionType,
  duration: Schema.optional(
    Schema.Number.pipe(Schema.int(), Schema.positive())
  ),
  createdAt: Schema.DateTimeUtcFromDate,
})

export const CreateInteractionInputSchema = Schema.Struct({
  storyId: Schema.UUID,
  interactionType: InteractionType,
  duration: Schema.optional(
    Schema.Number.pipe(Schema.int(), Schema.positive())
  ),
})

export const InteractionAggregateSchema = Schema.Struct({
  interactionType: InteractionType,
  count: Schema.Number.pipe(Schema.int(), Schema.positive()),
})

export type Interaction = Schema.Schema.Type<typeof InteractionSchema>
export type CreateInteractionInput = Schema.Schema.Type<
  typeof CreateInteractionInputSchema
>
export type InteractionAggregate = Schema.Schema.Type<
  typeof InteractionAggregateSchema
>
