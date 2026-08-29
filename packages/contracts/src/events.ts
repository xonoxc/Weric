import { Schema } from "effect"
import { StorySchema } from "./story.ts"
import { EvidenceSchema } from "./evidence.ts"
import { EntitySchema } from "./entity.ts"

const BaseEvent = Schema.Struct({
  id: Schema.UUID,
  timestamp: Schema.String,
})

export const StoryCreatedEventSchema = Schema.extend(
  BaseEvent,
  Schema.Struct({
    type: Schema.Literal("story:created"),
    payload: Schema.Struct({
      story: StorySchema,
    }),
  })
)

export const StoryUpdatedEventSchema = Schema.extend(
  BaseEvent,
  Schema.Struct({
    type: Schema.Literal("story:updated"),
    payload: Schema.Struct({
      storyId: Schema.UUID,
    }),
  })
)

export const StoryMergedEventSchema = Schema.extend(
  BaseEvent,
  Schema.Struct({
    type: Schema.Literal("story:merged"),
    payload: Schema.Struct({
      targetStoryId: Schema.UUID,
      sourceStoryId: Schema.UUID,
    }),
  })
)

export const EvidenceDiscoveredEventSchema = Schema.extend(
  BaseEvent,
  Schema.Struct({
    type: Schema.Literal("evidence:discovered"),
    payload: Schema.Struct({
      evidence: EvidenceSchema,
    }),
  })
)

export const UserBookmarkedEventSchema = Schema.extend(
  BaseEvent,
  Schema.Struct({
    type: Schema.Literal("user:bookmarked"),
    payload: Schema.Struct({
      userId: Schema.UUID,
      storyId: Schema.UUID,
    }),
  })
)

export const UserReadStoryEventSchema = Schema.extend(
  BaseEvent,
  Schema.Struct({
    type: Schema.Literal("user:read_story"),
    payload: Schema.Struct({
      userId: Schema.UUID,
      storyId: Schema.UUID,
      duration: Schema.optional(
        Schema.Number.pipe(Schema.int(), Schema.nonNegative())
      ),
    }),
  })
)

export const UserIgnoredStoryEventSchema = Schema.extend(
  BaseEvent,
  Schema.Struct({
    type: Schema.Literal("user:ignored_story"),
    payload: Schema.Struct({
      userId: Schema.UUID,
      storyId: Schema.UUID,
    }),
  })
)

export const RecommendationGeneratedEventSchema = Schema.extend(
  BaseEvent,
  Schema.Struct({
    type: Schema.Literal("recommendation:generated"),
    payload: Schema.Struct({
      userId: Schema.UUID,
      count: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
    }),
  })
)

export const WericEventSchema = Schema.Union(
  StoryCreatedEventSchema,
  StoryUpdatedEventSchema,
  StoryMergedEventSchema,
  EvidenceDiscoveredEventSchema,
  UserBookmarkedEventSchema,
  UserReadStoryEventSchema,
  UserIgnoredStoryEventSchema,
  RecommendationGeneratedEventSchema
)
export type StoryCreatedEvent = Schema.Schema.Type<
  typeof StoryCreatedEventSchema
>
export type StoryUpdatedEvent = Schema.Schema.Type<
  typeof StoryUpdatedEventSchema
>
export type StoryMergedEvent = Schema.Schema.Type<typeof StoryMergedEventSchema>
export type EvidenceDiscoveredEvent = Schema.Schema.Type<
  typeof EvidenceDiscoveredEventSchema
>
export type UserBookmarkedEvent = Schema.Schema.Type<
  typeof UserBookmarkedEventSchema
>
export type UserReadStoryEvent = Schema.Schema.Type<
  typeof UserReadStoryEventSchema
>
export type UserIgnoredStoryEvent = Schema.Schema.Type<
  typeof UserIgnoredStoryEventSchema
>
export type RecommendationGeneratedEvent = Schema.Schema.Type<
  typeof RecommendationGeneratedEventSchema
>
export type WericEvent = Schema.Schema.Type<typeof WericEventSchema>
