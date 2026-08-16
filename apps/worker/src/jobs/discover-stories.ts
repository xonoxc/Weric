import { Data, Effect, Schedule } from "effect"
import { StoryRepository, EvidenceRepository } from "@weric/database"
import { BrowserService } from "@weric/browser"
import { AIService } from "@weric/ai"

import type { JobHandler } from "~worker/runtime.ts"

export class DiscoverStoriesError extends Data.TaggedError(
  "DiscoverStoriesError"
)<{
  cause: unknown
}> {}

export function createDiscoverStoriesHandler(
  storyRepo: StoryRepository,
  evidenceRepo: EvidenceRepository,
  browser: BrowserService,
  ai: AIService
): JobHandler {
  return {
    type: "discover_stories",

    handle(
      payload: Record<string, unknown>,
      _jobId: string
    ): Effect.Effect<void, DiscoverStoriesError> {
      const url = payload.url as string | undefined
      if (!url) {
        return Effect.fail(
          createDiscoverStoriesError(new Error("Missing url in payload"))
        )
      }

      return Effect.gen(function* () {
        const page = yield* browser
          .fetchUrl(url)
          .pipe(Effect.mapError(createDiscoverStoriesError))

        const summary = yield* ai.summarize(page.text).pipe(
          Effect.retry({
            schedule: Schedule.exponential("1 second").pipe(
              Schedule.jittered,
              Schedule.compose(Schedule.recurs(2))
            ),
          }),
          Effect.catchAll(() =>
            Effect.succeed({
              summary: page.text.slice(0, 500),
              tone: "neutral" as const,
            })
          )
        )

        const slug = page.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 200)

        const evidence = yield* evidenceRepo
          .create({
            source: "discovery",
            url,
            author: null,
            title: page.title,
            content: page.text.slice(0, 10_000),
            metadata: { discoveredBy: "worker" },
            publishedAt: null,
          })
          .pipe(Effect.mapError(createDiscoverStoriesError))

        const existing = yield* storyRepo
          .findBySlug(slug)
          .pipe(Effect.catchAll(() => Effect.succeed(null)))

        if (!existing) {
          return yield* storyRepo
            .create({
              title: page.title,
              slug,
              summary: summary.summary ?? page.text.slice(0, 500),
              evidenceIds: [evidence.id],
            })
            .pipe(Effect.mapError(createDiscoverStoriesError))
        }

        yield* storyRepo
          .addEvidence(existing.id, evidence.id)
          .pipe(Effect.mapError(createDiscoverStoriesError))
      })
    },
  }
}

function createDiscoverStoriesError(cause: unknown): DiscoverStoriesError {
  return new DiscoverStoriesError({ cause })
}
