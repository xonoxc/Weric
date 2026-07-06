import { z } from "zod"
import { StorySchema } from "./story.ts"
import { EvidenceSchema } from "./evidence.ts"
import { EntitySchema } from "./entity.ts"

const BaseEvent = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
})

export const StoryCreatedEventSchema = BaseEvent.extend({
  type: z.literal("story:created"),
  payload: z.object({
    story: StorySchema,
  }),
})

export const StoryUpdatedEventSchema = BaseEvent.extend({
  type: z.literal("story:updated"),
  payload: z.object({
    storyId: z.string().uuid(),
  }),
})

export const StoryMergedEventSchema = BaseEvent.extend({
  type: z.literal("story:merged"),
  payload: z.object({
    targetStoryId: z.string().uuid(),
    sourceStoryId: z.string().uuid(),
  }),
})

export const EvidenceDiscoveredEventSchema = BaseEvent.extend({
  type: z.literal("evidence:discovered"),
  payload: z.object({
    evidence: EvidenceSchema,
  }),
})

export const UserBookmarkedEventSchema = BaseEvent.extend({
  type: z.literal("user:bookmarked"),
  payload: z.object({
    userId: z.string().uuid(),
    storyId: z.string().uuid(),
  }),
})

export const UserReadStoryEventSchema = BaseEvent.extend({
  type: z.literal("user:read_story"),
  payload: z.object({
    userId: z.string().uuid(),
    storyId: z.string().uuid(),
    duration: z.number().int().nonnegative().optional(),
  }),
})

export const UserIgnoredStoryEventSchema = BaseEvent.extend({
  type: z.literal("user:ignored_story"),
  payload: z.object({
    userId: z.string().uuid(),
    storyId: z.string().uuid(),
  }),
})

export const RecommendationGeneratedEventSchema = BaseEvent.extend({
  type: z.literal("recommendation:generated"),
  payload: z.object({
    userId: z.string().uuid(),
    count: z.number().int().nonnegative(),
  }),
})

export const WericEventSchema = z.discriminatedUnion("type", [
  StoryCreatedEventSchema,
  StoryUpdatedEventSchema,
  StoryMergedEventSchema,
  EvidenceDiscoveredEventSchema,
  UserBookmarkedEventSchema,
  UserReadStoryEventSchema,
  UserIgnoredStoryEventSchema,
  RecommendationGeneratedEventSchema,
])
export type StoryCreatedEvent = z.infer<typeof StoryCreatedEventSchema>
export type StoryUpdatedEvent = z.infer<typeof StoryUpdatedEventSchema>
export type StoryMergedEvent = z.infer<typeof StoryMergedEventSchema>
export type EvidenceDiscoveredEvent = z.infer<
  typeof EvidenceDiscoveredEventSchema
>
export type UserBookmarkedEvent = z.infer<typeof UserBookmarkedEventSchema>
export type UserReadStoryEvent = z.infer<typeof UserReadStoryEventSchema>
export type UserIgnoredStoryEvent = z.infer<typeof UserIgnoredStoryEventSchema>
export type RecommendationGeneratedEvent = z.infer<
  typeof RecommendationGeneratedEventSchema
>
export type WericEvent = z.infer<typeof WericEventSchema>
