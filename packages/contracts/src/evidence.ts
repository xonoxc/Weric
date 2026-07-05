import { z } from "zod"

export const EvidenceSource = z.enum([
  "rss",
  "github",
  "reddit",
  "hackernews",
  "web",
  "manual",
])
export type EvidenceSource = z.infer<typeof EvidenceSource>

export const EvidenceMetadataSchema = z.record(z.string(), z.unknown()).default({})
export type EvidenceMetadata = z.infer<typeof EvidenceMetadataSchema>

export const EvidenceSchema = z.object({
  id: z.string().uuid(),
  source: EvidenceSource,
  url: z.string().url(),
  author: z.string().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  metadata: EvidenceMetadataSchema,
  publishedAt: z.string().datetime().optional(),
  discoveredAt: z.string().datetime(),
})
export type Evidence = z.infer<typeof EvidenceSchema>

export const RawDocumentSchema = z.object({
  source: EvidenceSource,
  url: z.string().url(),
  author: z.string().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  metadata: EvidenceMetadataSchema,
  publishedAt: z.string().datetime().optional(),
})
export type RawDocument = z.infer<typeof RawDocumentSchema>

export const CreateEvidenceInputSchema = z.object({
  source: EvidenceSource,
  url: z.string().url(),
  author: z.string().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  metadata: EvidenceMetadataSchema.optional(),
  publishedAt: z.string().datetime().optional(),
})
export type CreateEvidenceInput = z.infer<typeof CreateEvidenceInputSchema>
