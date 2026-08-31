import { Schema } from "effect"

export const SummarySchema = Schema.Struct({
  summary: Schema.String.pipe(Schema.minLength(1)),
  keyPoints: Schema.Array(Schema.String),
  tone: Schema.Literal("neutral", "positive", "negative", "mixed"),
})
export type Summary = Schema.Schema.Type<typeof SummarySchema>

export const ClassificationSchema = Schema.Struct({
  category: Schema.String.pipe(Schema.minLength(1)),
  confidence: Schema.Number.pipe(
    Schema.greaterThanOrEqualTo(0),
    Schema.lessThanOrEqualTo(1)
  ),
  subcategories: Schema.Array(Schema.String),
})
export type Classification = Schema.Schema.Type<typeof ClassificationSchema>

export const ExtractedEntitySchema = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1)),
  type: Schema.Literal(
    "person",
    "organization",
    "location",
    "topic",
    "event",
    "product",
    "technology",
    "other"
  ),
  description: Schema.optional(Schema.String),
})
export type ExtractedEntity = Schema.Schema.Type<typeof ExtractedEntitySchema>

export const ExtractedEntitiesSchema = Schema.Struct({
  entities: Schema.Array(ExtractedEntitySchema),
})
export type ExtractedEntities = Schema.Schema.Type<
  typeof ExtractedEntitiesSchema
>

export const SynthesizedConceptSchema = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1)),
  summary: Schema.String,
  storyIds: Schema.Array(Schema.String),
})
export type SynthesizedConcept = Schema.Schema.Type<
  typeof SynthesizedConceptSchema
>

export const SynthesizedEdgeSchema = Schema.Struct({
  source: Schema.String.pipe(Schema.minLength(1)),
  target: Schema.String.pipe(Schema.minLength(1)),
  label: Schema.String,
})
export type SynthesizedEdge = Schema.Schema.Type<typeof SynthesizedEdgeSchema>

export const SynthesizedGraphSchema = Schema.Struct({
  concepts: Schema.Array(SynthesizedConceptSchema),
  edges: Schema.Array(SynthesizedEdgeSchema),
})
export type SynthesizedGraph = Schema.Schema.Type<typeof SynthesizedGraphSchema>
