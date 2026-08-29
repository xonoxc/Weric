import { Schema } from "effect"

export const RelationType = Schema.Literal(
  "mentions",
  "affiliated_with",
  "located_in",
  "acquired",
  "acquired_by",
  "collaborates_with",
  "competes_with",
  "employs",
  "employed_by",
  "funds",
  "funded_by",
  "related_to"
)
export type RelationType = Schema.Schema.Type<typeof RelationType>

export const RelationshipSchema = Schema.Struct({
  id: Schema.UUID,
  sourceEntity: Schema.UUID,
  targetEntity: Schema.UUID,
  relationType: RelationType,
})
export type Relationship = Schema.Schema.Type<typeof RelationshipSchema>

export const CreateRelationshipInputSchema = Schema.Struct({
  sourceEntity: Schema.UUID,
  targetEntity: Schema.UUID,
  relationType: RelationType,
})
export type CreateRelationshipInput = Schema.Schema.Type<
  typeof CreateRelationshipInputSchema
>
