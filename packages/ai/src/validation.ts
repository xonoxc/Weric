import { z } from "zod"

export const SummarySchema = z.object({
  summary: z.string().min(1),
  keyPoints: z.array(z.string()),
  tone: z.enum(["neutral", "positive", "negative", "mixed"]),
})

export type Summary = {
  summary: string
  keyPoints: string[]
  tone: "neutral" | "positive" | "negative" | "mixed"
}

export const ClassificationSchema = z.object({
  category: z.string().min(1),
  confidence: z.number().min(0).max(1),
  subcategories: z.array(z.string()),
})

export type Classification = {
  category: string
  confidence: number
  subcategories: string[]
}

export const ExtractedEntitySchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    "person",
    "organization",
    "location",
    "topic",
    "event",
    "product",
    "technology",
    "other",
  ]),
  description: z.string().optional(),
})

export type ExtractedEntity = z.infer<typeof ExtractedEntitySchema>

export const ExtractedEntitiesSchema = z.object({
  entities: z.array(ExtractedEntitySchema),
})

export type ExtractedEntities = z.infer<typeof ExtractedEntitiesSchema>
