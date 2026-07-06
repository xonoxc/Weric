import { Effect } from "effect"
import { StoryRepository, EvidenceRepository } from "@weric/database"
import { BrowserService } from "@weric/browser"
import { AIService } from "@weric/ai"
import type { JobHandler } from "../runtime.ts"

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
    ): Effect.Effect<void, Error> {
      const url = payload.url as string | undefined
      if (!url) {
        return Effect.fail(
          new Error("discover_stories requires a 'url' in payload")
        )
      }

      return Effect.gen(function* () {
        const page = yield* Effect.tryPromise({
          try: () => Effect.runPromise(browser.fetchUrl(url)),
          catch: (cause: unknown) => new Error(`Failed to fetch URL: ${cause}`),
        })

        const summary = yield* Effect.tryPromise({
          try: () => Effect.runPromise(ai.summarize(page.text)),
          catch: (cause: unknown) =>
            new Error(`AI summarization failed: ${cause}`),
        }).pipe(
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

        const evidence = yield* Effect.tryPromise({
          try: () =>
            Effect.runPromise(
              evidenceRepo.create({
                source: "discovery",
                url,
                author: null,
                title: page.title,
                content: page.text.slice(0, 10_000),
                metadata: { discoveredBy: "worker" },
                publishedAt: null,
              })
            ),
          catch: (cause: unknown) =>
            new Error(`Failed to create evidence: ${cause}`),
        })

        const existing = yield* Effect.tryPromise({
          try: () => Effect.runPromise(storyRepo.findBySlug(slug)),
          catch: (cause: unknown) =>
            new Error(`Failed to find by slug: ${cause}`),
        }).pipe(Effect.catchAll(() => Effect.succeed(null)))

        if (existing) {
          yield* Effect.tryPromise({
            try: () =>
              Effect.runPromise(
                storyRepo.addEvidence(existing.id, evidence.id)
              ),
            catch: (cause: unknown) =>
              new Error(`Failed to link evidence: ${cause}`),
          })
        } else {
          yield* Effect.tryPromise({
            try: () =>
              Effect.runPromise(
                storyRepo.create({
                  title: page.title,
                  slug,
                  summary: summary.summary ?? page.text.slice(0, 500),
                  evidenceIds: [evidence.id],
                })
              ),
            catch: (cause: unknown) =>
              new Error(`Failed to create story: ${cause}`),
          })
        }
      })
    },
  }
}
