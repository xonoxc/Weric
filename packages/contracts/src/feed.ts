import { z } from "zod"
import { StorySummarySchema } from "./story.ts"

export const FeedItemSchema = z.object({
  story: StorySummarySchema,
  score: z.number().min(0).max(1),
  reason: z.string().optional(),
})
export type FeedItem = z.infer<typeof FeedItemSchema>

export const FeedSchema = z.object({
  data: z.array(FeedItemSchema),
  meta: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
  }),
})
export type Feed = z.infer<typeof FeedSchema>

export const FeedOptionsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})
export type FeedOptions = z.infer<typeof FeedOptionsSchema>
