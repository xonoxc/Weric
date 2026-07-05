import { Effect } from "effect"
import type { StoryRepository } from "@weric/database"
import { MergeError, StoryNotFoundError } from "./errors.ts"
import type { StoryError } from "./errors.ts"

export interface MergeResult {
  storyId: string
  title: string
  summary: string | null
  confidence: number
}

function mergeSummaries(
  targetSummary: string | null,
  sourceSummary: string | null
): string {
  if (!targetSummary && !sourceSummary) return ""
  if (!targetSummary) return sourceSummary ?? ""
  if (!sourceSummary) return targetSummary

  const targetSentences = targetSummary.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sourceSentences = sourceSummary.split(/[.!?]+/).filter(s => s.trim().length > 0)

  const merged = [...new Set([...targetSentences, ...sourceSentences])]
  return merged.join(". ").trim() + "."
}

export class StoryMerger {
  constructor(private readonly storyRepo: StoryRepository) {}

  merge(targetId: string, sourceId: string): Effect.Effect<MergeResult, StoryError> {
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

      if (!target) {
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

      if (!source) {
        return yield* Effect.fail(new StoryNotFoundError({ storyId: sourceId }))
      }

      const mergedSummary = mergeSummaries(target.summary ?? null, source.summary ?? null)
      const mergedConfidence = Math.min(
        ((target.confidence ?? 0) + (source.confidence ?? 0)) / 2 + 0.05,
        1.0
      )

      yield* storyRepo
        .update(targetId, {
          summary: mergedSummary || undefined,
          confidence: mergedConfidence,
          status: "published",
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
        title: target.title,
        summary: mergedSummary || null,
        confidence: mergedConfidence,
      }
    })
  }
}
