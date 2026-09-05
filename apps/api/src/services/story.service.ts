import { Effect, Schema } from "effect"
import { StoryRepository, EvidenceRepository } from "@weric/database"
import { evidence } from "~db/schema/tables.ts"
import { CreateEvidenceInputSchema, EvidenceSource } from "@weric/contracts"

import type { StoryQueryOptions, StoryDetail } from "@weric/database"
import type { RepositoryError } from "@weric/database"

type EvidenceRow = (typeof evidence)["$inferSelect"]

export interface CreateEvidenceData {
  readonly source: EvidenceSource
  readonly url: string
  readonly author?: string | null
  readonly title: string
  readonly content: string
  readonly metadata?: Record<string, unknown>
  readonly publishedAt?: Date | null
}

export interface StoryServiceShape {
  readonly listStories: (
    options: StoryQueryOptions
  ) => Effect.Effect<
    { data: import("@weric/database").StoryWithEvidenceCount[]; total: number },
    RepositoryError
  >

  readonly getStoryBySlug: (
    slug: string
  ) => Effect.Effect<StoryDetail | null, RepositoryError>

  readonly createEvidence: (
    input: CreateEvidenceData
  ) => Effect.Effect<EvidenceRow, RepositoryError>
}

export class StoryService extends Effect.Service<StoryServiceShape>()(
  "StoryService",
  {
    effect: Effect.gen(function* () {
      const storyRepo = yield* StoryRepository
      const evidenceRepo = yield* EvidenceRepository

      return {
        listStories: options => storyRepo.findManyWithEvidenceCount(options),

        getStoryBySlug: slug => storyRepo.findBySlugWithDetails(slug),

        createEvidence: input => evidenceRepo.create(input),
      } satisfies StoryServiceShape
    }),
  }
) {}

export const StoryServiceLive = StoryService.Default

export const parseCreateEvidence = (raw: unknown) => {
  const parsed = Schema.decodeUnknownSync(CreateEvidenceInputSchema)(raw)
  return {
    source: parsed.source,
    url: parsed.url,
    author: parsed.author ?? null,
    title: parsed.title,
    content: parsed.content,
    metadata: parsed.metadata,
    publishedAt: parsed.publishedAt ? new Date(parsed.publishedAt) : null,
  }
}
