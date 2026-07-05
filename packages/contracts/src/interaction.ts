import { z } from "zod"

export const InteractionType = z.enum([
  "read",
  "read_complete",
  "click",
  "share",
  "hide",
  "save",
])
export type InteractionType = z.infer<typeof InteractionType>

export const InteractionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  storyId: z.string().uuid(),
  interactionType: InteractionType,
  duration: z.number().int().nonnegative().optional(),
  createdAt: z.string().datetime(),
})
export type Interaction = z.infer<typeof InteractionSchema>

export const CreateInteractionInputSchema = z.object({
  storyId: z.string().uuid(),
  interactionType: InteractionType,
  duration: z.number().int().nonnegative().optional(),
})
export type CreateInteractionInput = z.infer<typeof CreateInteractionInputSchema>

export const InteractionAggregateSchema = z.object({
  interactionType: InteractionType,
  count: z.number().int().nonnegative(),
})
export type InteractionAggregate = z.infer<typeof InteractionAggregateSchema>
