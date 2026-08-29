import { Schema } from "effect"

export const EntityType = Schema.Literal(
  "person",
  "organization",
  "location",
  "topic",
  "event",
  "product",
  "technology",
  "other"
)
export type EntityType = Schema.Schema.Type<typeof EntityType>

export const EntitySchema = Schema.Struct({
  id: Schema.UUID,
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(300)),
  type: EntityType,
  aliases: Schema.optional(Schema.Array(Schema.String)).pipe(
    Schema.withDecodingDefault(() => [])
  ),
})
export type Entity = Schema.Schema.Type<typeof EntitySchema>

export const CreateEntityInputSchema = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(300)),
  type: EntityType,
  aliases: Schema.optional(Schema.Array(Schema.String)),
})
export type CreateEntityInput = Schema.Schema.Type<
  typeof CreateEntityInputSchema
>

export const StoryEntityLinkSchema = Schema.Struct({
  storyId: Schema.UUID,
  entityId: Schema.UUID,
})
export type StoryEntityLink = Schema.Schema.Type<typeof StoryEntityLinkSchema>
