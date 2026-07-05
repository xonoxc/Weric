import { z } from "zod"

export const EntityType = z.enum([
  "person",
  "organization",
  "location",
  "topic",
  "event",
  "product",
  "technology",
  "other",
])
export type EntityType = z.infer<typeof EntityType>

export const EntitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(300),
  type: EntityType,
  aliases: z.array(z.string()).default([]),
})
export type Entity = z.infer<typeof EntitySchema>

export const CreateEntityInputSchema = z.object({
  name: z.string().min(1).max(300),
  type: EntityType,
  aliases: z.array(z.string()).optional(),
})
export type CreateEntityInput = z.infer<typeof CreateEntityInputSchema>

export const StoryEntityLinkSchema = z.object({
  storyId: z.string().uuid(),
  entityId: z.string().uuid(),
})
export type StoryEntityLink = z.infer<typeof StoryEntityLinkSchema>
