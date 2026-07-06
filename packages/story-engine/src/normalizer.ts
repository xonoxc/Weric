import { Effect } from "effect"
import type { RawDocument } from "@weric/contracts"
import type { EvidenceRepository } from "@weric/database"
import { NormalizationError, DuplicateEvidenceError } from "./errors.ts"
import type { StoryError } from "./errors.ts"

export interface NormalizedDocument {
  source: string
  url: string
  author: string | null
  title: string
  content: string
  publishedAt: Date | null
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "")
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + "..."
}

export class StoryNormalizer {
  constructor(private readonly evidenceRepo: EvidenceRepository) {}

  normalize(raw: RawDocument): Effect.Effect<NormalizedDocument, StoryError> {
    const evidenceRepo = this.evidenceRepo

    return Effect.gen(function* () {
      if (!raw.title || raw.title.trim().length === 0) {
        return yield* Effect.fail(
          new NormalizationError({ message: "Evidence title is empty" })
        )
      }
      if (!raw.content || raw.content.trim().length === 0) {
        return yield* Effect.fail(
          new NormalizationError({ message: "Evidence content is empty" })
        )
      }

      const existing = yield* evidenceRepo.findByUrl(raw.url).pipe(
        Effect.catchAll(() =>
          Effect.fail(
            new NormalizationError({
              message: "Failed to check for duplicate URL",
            })
          )
        )
      )

      if (existing) {
        return yield* Effect.fail(new DuplicateEvidenceError({ url: raw.url }))
      }

      const cleanContent = truncate(stripHtml(raw.content.trim()), 50000)
      const title = truncate(raw.title.trim(), 500)

      return {
        source: raw.source as string,
        url: raw.url,
        author: raw.author ?? null,
        title,
        content: cleanContent,
        publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : null,
      }
    })
  }

  normalizeBatch(
    raws: RawDocument[]
  ): Effect.Effect<NormalizedDocument[], StoryError> {
    return Effect.forEach(raws, raw => this.normalize(raw), { concurrency: 3 })
  }
}
