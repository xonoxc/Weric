import { z } from "zod"

export const StoryStatus = z.enum(["draft", "published", "archived"])
export type StoryStatus = z.infer<typeof StoryStatus>

export const StorySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(500),
  summary: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0),
  status: StoryStatus.default("draft"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Story = z.infer<typeof StorySchema>

export const CreateStoryInputSchema = z.object({
  title: z.string().min(1).max(500),
  summary: z.string().optional(),
  evidenceIds: z.array(z.string().uuid()).default([]),
})
export type CreateStoryInput = z.infer<typeof CreateStoryInputSchema>

export const UpdateStoryInputSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  summary: z.string().optional(),
  status: StoryStatus.optional(),
  confidence: z.number().min(0).max(1).optional(),
})
export type UpdateStoryInput = z.infer<typeof UpdateStoryInputSchema>

export const StorySummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  summary: z.string().optional(),
  confidence: z.number(),
  status: StoryStatus,
  evidenceCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type StorySummary = z.infer<typeof StorySummarySchema>
