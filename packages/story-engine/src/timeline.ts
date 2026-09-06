import { Effect, Option } from "effect"
import { ServiceError, StoryNotFoundError } from "./errors.ts"

import type { StoryRepository } from "@weric/database"
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
            Effect.fail(
              new ServiceError({ message: "Failed to fetch story", cause })
            )
          )
        )

      if (Option.isNone(story)) {
        return yield* Effect.fail(new StoryNotFoundError({ storyId }))
      }

      const s = story.value
      const entries: TimelineEntry[] = []

      entries.push({
        date: s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt),
        type: "created",
        description: `Story "${s.title}" was created`,
      })

      if (s.updatedAt && (!s.createdAt || s.updatedAt > s.createdAt)) {
        entries.push({
          date:
            s.updatedAt instanceof Date ? s.updatedAt : new Date(s.updatedAt),
          type: "updated",
          description: `Story "${s.title}" was updated`,
        })
      }

      return entries.sort((a, b) => a.date.getTime() - b.date.getTime())
    })
  }
}
