import { Schema } from "effect"
import { HTTP_URL_REGEX } from "@weric/shared"

export const EvidenceSource = Schema.Literal(
  "rss",
  "github",
  "reddit",
  "hackernews",
  "web",
  "manual"
)
export type EvidenceSource = Schema.Schema.Type<typeof EvidenceSource>

export const EvidenceMetadataSchema = Schema.Record({
  key: Schema.String,
  value: Schema.Unknown,
})
export type EvidenceMetadata = Schema.Schema.Type<typeof EvidenceMetadataSchema>

export const EvidenceSchema = Schema.Struct({
  id: Schema.UUID,
  source: EvidenceSource,
  url: Schema.String.pipe(Schema.pattern(HTTP_URL_REGEX)),
  author: Schema.optional(Schema.String),
  title: Schema.String.pipe(Schema.minLength(1)),
  content: Schema.String.pipe(Schema.minLength(1)),
  metadata: Schema.optional(EvidenceMetadataSchema).pipe(
    Schema.withDecodingDefault(() => ({}))
  ),
  publishedAt: Schema.optional(Schema.String),
  discoveredAt: Schema.String,
})
export type Evidence = Schema.Schema.Type<typeof EvidenceSchema>

export const RawDocumentSchema = Schema.Struct({
  source: EvidenceSource,
  url: Schema.String.pipe(Schema.pattern(HTTP_URL_REGEX)),
  author: Schema.optional(Schema.String),
  title: Schema.String.pipe(Schema.minLength(1)),
  content: Schema.String.pipe(Schema.minLength(1)),
  metadata: Schema.optional(EvidenceMetadataSchema).pipe(
    Schema.withDecodingDefault(() => ({}))
  ),
  publishedAt: Schema.optional(Schema.String),
})
export type RawDocument = Schema.Schema.Type<typeof RawDocumentSchema>

export const CreateEvidenceInputSchema = Schema.Struct({
  source: EvidenceSource,
  url: Schema.String.pipe(Schema.pattern(HTTP_URL_REGEX)),
  author: Schema.optional(Schema.String),
  title: Schema.String.pipe(Schema.minLength(1)),
  content: Schema.String.pipe(Schema.minLength(1)),
  metadata: Schema.optional(EvidenceMetadataSchema),
  publishedAt: Schema.optional(Schema.String),
})
export type CreateEvidenceInput = Schema.Schema.Type<
  typeof CreateEvidenceInputSchema
>
