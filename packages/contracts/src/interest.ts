import { z } from "zod"

export const InterestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  topic: z.string().min(1).max(200),
  score: z.number().min(0).max(1).default(0),
  updatedAt: z.string().datetime(),
})
export type Interest = z.infer<typeof InterestSchema>

export const CreateInterestInputSchema = z.object({
  topic: z.string().min(1).max(200),
})
export type CreateInterestInput = z.infer<typeof CreateInterestInputSchema>

export const InterestUpdateSchema = z.object({
  topic: z.string().min(1).max(200),
  score: z.number().min(0).max(1),
})
export type InterestUpdate = z.infer<typeof InterestUpdateSchema>
