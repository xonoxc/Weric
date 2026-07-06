import { Effect, Random } from "effect"
import type { EvidenceRepository, StoryRepository } from "@weric/database"
import { ServiceError } from "./errors.ts"
import type { StoryError } from "./errors.ts"
import type { NormalizedDocument } from "./normalizer.ts"
import { StoryNormalizer } from "./normalizer.ts"
import { StoryMatcher } from "./matcher.ts"
import type { MatchResult } from "./matcher.ts"
import { EntityExtractor } from "./extractor.ts"
import { StoryMerger } from "./merger.ts"
import type { MergeResult } from "./merger.ts"
import { TimelineBuilder } from "./timeline.ts"
import type { TimelineEntry } from "./timeline.ts"
import type { RawDocument } from "@weric/contracts"

export interface IngestResult {
  story: {
    id: string
    title: string
    slug: string
    summary: string | null
    createdAt: Date
  }
  entities: Array<{ name: string; type: string }>
  match?: MatchResult
  timeline: TimelineEntry[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200)
}

export class StoryService {
  constructor(
    private readonly normalizer: StoryNormalizer,
    private readonly matcher: StoryMatcher,
    private readonly extractor: EntityExtractor,
    private readonly merger: StoryMerger,
    private readonly timeline: TimelineBuilder,
    private readonly storyRepo: StoryRepository,
    private readonly evidenceRepo: EvidenceRepository
  ) {}

  ingest(raws: RawDocument[]): Effect.Effect<IngestResult[], StoryError> {
    const normalizer = this.normalizer
    const matcher = this.matcher
    const linkToExisting = this.linkToExistingStory.bind(this)
    const createNew = this.createNewStory.bind(this)

    return Effect.gen(function* () {
      const documents = yield* normalizer.normalizeBatch(raws)
      const results: IngestResult[] = []

      for (const doc of documents) {
        const matches = yield* matcher.findMatches(doc)
        const bestMatch = matches[0] ?? null

        if (bestMatch && bestMatch.confidence > 0.4) {
          const result = yield* linkToExisting(doc, bestMatch)
          results.push(result)
        } else {
          const result = yield* createNew(doc)
          results.push(result)
        }
      }

      return results
    })
  }

  private createNewStory(
    doc: NormalizedDocument
  ): Effect.Effect<IngestResult, StoryError> {
    const storyRepo = this.storyRepo
    const evidenceRepo = this.evidenceRepo
    const extractor = this.extractor
    const timeline = this.timeline

    return Effect.gen(function* () {
      const slug = yield* generateUniqueSlug(doc.title, storyRepo)

      const story = yield* storyRepo
        .create({ title: doc.title, slug, summary: doc.content.slice(0, 300) })
        .pipe(
          Effect.catchAll(cause =>
            Effect.fail(
              new ServiceError({ message: "Failed to create story", cause })
            )
          )
        )

      yield* evidenceRepo
        .create({
          source: doc.source,
          url: doc.url,
          author: doc.author,
          title: doc.title,
          content: doc.content,
          publishedAt: doc.publishedAt,
        })
        .pipe(
          Effect.catchAll(cause =>
            Effect.fail(
              new ServiceError({ message: "Failed to create evidence", cause })
            )
          )
        )

      const entities = yield* extractor.extract(doc, story.id)
      const entries = yield* timeline.buildTimeline(story.id)

      return {
        story: {
          id: story.id,
          title: story.title,
          slug: story.slug,
          summary: story.summary ?? null,
          createdAt:
            story.createdAt instanceof Date
              ? story.createdAt
              : new Date(story.createdAt),
        },
        entities,
        timeline: entries,
      }
    })
  }

  private linkToExistingStory(
    doc: NormalizedDocument,
    match: MatchResult
  ): Effect.Effect<IngestResult, StoryError> {
    const evidenceRepo = this.evidenceRepo
    const extractor = this.extractor
    const storyRepo = this.storyRepo
    const timeline = this.timeline

    return Effect.gen(function* () {
      yield* evidenceRepo
        .create({
          source: doc.source,
          url: doc.url,
          author: doc.author,
          title: doc.title,
          content: doc.content,
          publishedAt: doc.publishedAt,
        })
        .pipe(
          Effect.catchAll(cause =>
            Effect.fail(
              new ServiceError({ message: "Failed to create evidence", cause })
            )
          )
        )

      const entities = yield* extractor.extract(doc, match.storyId)

      const story = yield* storyRepo.findById(match.storyId).pipe(
        Effect.catchAll(cause =>
          Effect.fail(
            new ServiceError({
              message: "Failed to fetch matched story",
              cause,
            })
          )
        )
      )

      const entries = yield* timeline.buildTimeline(match.storyId)

      return {
        story: {
          id: match.storyId,
          title: match.title,
          slug: slugify(match.title),
          summary: (story?.summary ?? null) as string | null,
          createdAt:
            story?.createdAt instanceof Date
              ? story.createdAt
              : new Date(story?.createdAt ?? Date.now()),
        },
        entities,
        match,
        timeline: entries,
      }
    })
  }

  update(
    storyId: string,
    data: { summary?: string; confidence?: number }
  ): Effect.Effect<IngestResult, StoryError> {
    const storyRepo = this.storyRepo
    const timeline = this.timeline

    return Effect.gen(function* () {
      const story = yield* storyRepo
        .update(storyId, data)
        .pipe(
          Effect.catchAll(cause =>
            Effect.fail(
              new ServiceError({ message: "Failed to update story", cause })
            )
          )
        )

      const entries = yield* timeline.buildTimeline(storyId)

      return {
        story: {
          id: story.id,
          title: story.title,
          slug: story.slug,
          summary: story.summary ?? null,
          createdAt:
            story.createdAt instanceof Date
              ? story.createdAt
              : new Date(story.createdAt),
        },
        entities: [],
        timeline: entries,
      }
    })
  }

  merge(
    targetId: string,
    sourceId: string
  ): Effect.Effect<MergeResult, StoryError> {
    return this.merger.merge(targetId, sourceId)
  }

  rebuild(storyId: string): Effect.Effect<TimelineEntry[], StoryError> {
    return this.timeline.buildTimeline(storyId)
  }
}

function generateUniqueSlug(
  title: string,
  storyRepo: StoryRepository
): Effect.Effect<string, StoryError> {
  const baseSlug = slugify(title)

  return Effect.gen(function* () {
    let slug = baseSlug
    let attempt = 0

    while (true) {
      const existing = yield* storyRepo.findBySlug(slug).pipe(
        Effect.catchAll(cause =>
          Effect.fail(
            new ServiceError({
              message: "Failed to check slug uniqueness",
              cause,
            })
          )
        )
      )

      if (!existing) return slug

      attempt++
      const suffix = yield* Random.nextIntBetween(1000, 9999)
      slug = `${baseSlug}-${suffix}`
    }
  })
}
