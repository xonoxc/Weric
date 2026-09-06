import { Effect, Option } from "effect"
import { MergeError, StoryNotFoundError } from "./errors.ts"

import type { StoryRepository } from "@weric/database"
import type { StoryError } from "./errors.ts"
import type { Optioned } from "@weric/utils"

export interface MergeResult {
  storyId: string
  title: string
  summary: Optioned<string>
  confidence: number
}

function mergeSummaries(
  targetSummary: Optioned<string>,
  sourceSummary: Optioned<string>
): string {
  const target = Option.getOrElse(targetSummary, () => "")
  const source = Option.getOrElse(sourceSummary, () => "")
  if (!target && !source) return ""
  if (!target) return source
  if (!source) return target

  const targetSentences = target
    .split(/[.!?]+/)
    .filter(s => s.trim().length > 0)
  const sourceSentences = source
    .split(/[.!?]+/)
    .filter(s => s.trim().length > 0)

  const merged = [...new Set([...targetSentences, ...sourceSentences])]
  return merged.join(". ").trim() + "."
}

export class StoryMerger {
  constructor(private readonly storyRepo: StoryRepository) {}

  merge(
    targetId: string,
    sourceId: string
  ): Effect.Effect<MergeResult, StoryError> {
    const storyRepo = this.storyRepo

    if (targetId === sourceId) {
      return Effect.fail(
        new MergeError({
          message: "Cannot merge a story with itself",
        })
      )
    }

    return Effect.gen(function* () {
      const target = yield* storyRepo.findById(targetId).pipe(
        Effect.catchAll(cause =>
          Effect.fail(
            new MergeError({
              message: "Failed to fetch target story",
              cause,
            })
          )
        )
      )

      if (Option.isNone(target)) {
        return yield* Effect.fail(new StoryNotFoundError({ storyId: targetId }))
      }

      const source = yield* storyRepo.findById(sourceId).pipe(
        Effect.catchAll(cause =>
          Effect.fail(
            new MergeError({
              message: "Failed to fetch source story",
              cause,
            })
          )
        )
      )

      if (Option.isNone(source)) {
        return yield* Effect.fail(new StoryNotFoundError({ storyId: sourceId }))
      }

      const mergedSummary = mergeSummaries(
        Option.fromNullable(target.value.summary),
        Option.fromNullable(source.value.summary)
      )
      const mergedConfidence = Math.min(
        ((target.value.confidence ?? 0) + (source.value.confidence ?? 0)) / 2 +
          0.05,
        1.0
      )

      yield* storyRepo
        .update(targetId, {
          summary: mergedSummary ? Option.some(mergedSummary) : Option.none(),
          confidence: Option.some(mergedConfidence),
          status: Option.some("published" as const),
        })
        .pipe(
          Effect.catchAll(cause =>
            Effect.fail(
              new MergeError({
                message: "Failed to update target story",
                cause,
              })
            )
          )
        )

      yield* storyRepo.delete(sourceId).pipe(
        Effect.catchAll(cause =>
          Effect.fail(
            new MergeError({
              message: "Failed to delete source story",
              cause,
            })
          )
        )
      )

      return {
        storyId: targetId,
        title: target.value.title,
        summary: Option.some(mergedSummary),
        confidence: mergedConfidence,
      }
    })
  }
}
