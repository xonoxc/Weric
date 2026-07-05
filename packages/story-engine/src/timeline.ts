import { Effect } from "effect"
import type { StoryRepository } from "@weric/database"
import { ServiceError, StoryNotFoundError } from "./errors.ts"
import type { StoryError } from "./errors.ts"

export interface TimelineEntry {
  date: Date
  type: "created" | "evidence_added" | "updated" | "merged"
  description: string
}

export class TimelineBuilder {
  constructor(private readonly storyRepo: StoryRepository) {}

  buildTimeline(storyId: string): Effect.Effect<TimelineEntry[], StoryError> {
    const storyRepo = this.storyRepo

    return Effect.gen(function* () {
      const story = yield* storyRepo
        .findById(storyId)
        .pipe(
          Effect.catchAll(cause =>
            Effect.fail(new ServiceError({ message: "Failed to fetch story", cause }))
          )
        )

      if (!story) {
        return yield* Effect.fail(new StoryNotFoundError({ storyId }))
      }

      const entries: TimelineEntry[] = []

      entries.push({
        date:
          story.createdAt instanceof Date ? story.createdAt : new Date(story.createdAt),
        type: "created",
        description: `Story "${story.title}" was created`,
      })

      if (story.updatedAt && (!story.createdAt || story.updatedAt > story.createdAt)) {
        entries.push({
          date:
            story.updatedAt instanceof Date ? story.updatedAt : new Date(story.updatedAt),
          type: "updated",
          description: `Story "${story.title}" was updated`,
        })
      }

      return entries.sort((a, b) => a.date.getTime() - b.date.getTime())
    })
  }
}
