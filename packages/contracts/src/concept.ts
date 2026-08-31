import { Schema } from "effect"

export const ConceptSchema = Schema.Struct({
  id: Schema.UUID,
  chatId: Schema.UUID,
  name: Schema.String.pipe(Schema.minLength(1)),
  summary: Schema.NullOr(Schema.String),
  positionX: Schema.NullOr(Schema.Number),
  positionY: Schema.NullOr(Schema.Number),
})
export type Concept = Schema.Schema.Type<typeof ConceptSchema>

export const CreateConceptInputSchema = Schema.Struct({
  chatId: Schema.UUID,
  name: Schema.String.pipe(Schema.minLength(1)),
  summary: Schema.optional(Schema.String),
  positionX: Schema.optional(Schema.Number),
  positionY: Schema.optional(Schema.Number),
})
export type CreateConceptInput = Schema.Schema.Type<
  typeof CreateConceptInputSchema
>

export const ConceptEdgeSchema = Schema.Struct({
  id: Schema.UUID,
  chatId: Schema.UUID,
  sourceConcept: Schema.UUID,
  targetConcept: Schema.UUID,
  label: Schema.String,
})
export type ConceptEdge = Schema.Schema.Type<typeof ConceptEdgeSchema>

export const CreateConceptEdgeInputSchema = Schema.Struct({
  chatId: Schema.UUID,
  sourceConcept: Schema.UUID,
  targetConcept: Schema.UUID,
  label: Schema.String,
})
export type CreateConceptEdgeInput = Schema.Schema.Type<
  typeof CreateConceptEdgeInputSchema
>

export const ConceptStoryLinkSchema = Schema.Struct({
  conceptId: Schema.UUID,
  storyId: Schema.UUID,
})
export type ConceptStoryLink = Schema.Schema.Type<typeof ConceptStoryLinkSchema>

export const ConceptGraphSchema = Schema.Struct({
  nodes: Schema.Array(ConceptSchema),
  edges: Schema.Array(ConceptEdgeSchema),
  conceptStories: Schema.Array(ConceptStoryLinkSchema),
})
export type ConceptGraph = Schema.Schema.Type<typeof ConceptGraphSchema>
