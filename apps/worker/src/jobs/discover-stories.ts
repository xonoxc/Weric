import { Data, Effect, Option, pipe, Schedule, String as Str } from "effect"
import { BrowserService } from "@weric/browser"
import { AIService } from "@weric/ai"

import type { JobHandler } from "~worker/runtime.ts"
import type {
  StoryRepositoryShape,
  EvidenceRepositoryShape,
} from "@weric/database"
import type { Optioned } from "@weric/utils"

export class DiscoverStoriesError extends Data.TaggedError(
  "DiscoverStoriesError"
)<{
  cause: unknown
}> {}

export class StoryFindBySlugError extends Data.TaggedError(
  "StoryFindBySlugError"
)<{
  slug: string
  cause: unknown
}> {}

export function createDiscoverStoriesHandler(
  storyRepo: StoryRepositoryShape,
  evidenceRepo: EvidenceRepositoryShape,
  browser: BrowserService,
  ai: AIService
): JobHandler {
  return {
    type: "discover_stories",

    handle(
      payload: Record<string, unknown>
    ): Effect.Effect<void, DiscoverStoriesError | StoryFindBySlugError> {
      const url: Optioned<string> = Str.isString(payload.url)
        ? Option.some(payload.url)
        : Option.none()

      return Option.match(url, {
        onNone: () =>
          Effect.fail(
            new DiscoverStoriesError({
              cause: new Error("Missing url in payload"),
            })
          ),

        onSome: url =>
          Effect.gen(function* () {
            const page = yield* browser
              .fetchUrl(url)
              .pipe(
                Effect.mapError(e => new DiscoverStoriesError({ cause: e }))
              )

            const summarizeRes = yield* pipe(
              ai.summarize(page.text),
              Effect.retry({
                schedule: Schedule.exponential("1 second").pipe(
                  Schedule.jittered,
                  Schedule.compose(Schedule.recurs(2))
                ),
              }),
              Effect.orElseSucceed(() => ({
                summary: page.text.slice(0, 500),
                tone: "neutral" as const,
              }))
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
                author: Option.none(),
                title: page.title,
                content: page.text.slice(0, 10_000),
                metadata: { discoveredBy: "worker" },
                publishedAt: Option.none(),
              })
              .pipe(
                Effect.mapError(e => new DiscoverStoriesError({ cause: e }))
              )

            const existing = yield* storyRepo
              .findBySlug(slug)
              .pipe(
                Effect.mapError(e => new DiscoverStoriesError({ cause: e }))
              )

            if (Option.isNone(existing)) {
              return yield* storyRepo
                .create({
                  title: page.title,
                  slug,
                  summary: Option.some(
                    summarizeRes.summary ?? page.text.slice(0, 500)
                  ),
                  evidenceIds: [evidence.id],
                })
                .pipe(
                  Effect.mapError(e => new DiscoverStoriesError({ cause: e }))
                )
            }

            yield* storyRepo
              .addEvidence(existing.value.id, evidence.id)
              .pipe(
                Effect.mapError(e => new DiscoverStoriesError({ cause: e }))
              )
          }),
      })
    },
  }
}
