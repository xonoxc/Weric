import { Effect } from "effect"
import { StoryRepository, EvidenceRepository } from "@weric/database"
import { BrowserService } from "@weric/browser"
import type { JobHandler } from "../runtime.ts"

export function createRefreshStoryHandler(
  storyRepo: StoryRepository,
  evidenceRepo: EvidenceRepository,
  browser: BrowserService
): JobHandler {
  return {
    type: "refresh_story",

    handle(
      payload: Record<string, unknown>,
      _jobId: string
    ): Effect.Effect<void, Error> {
      const storyId = payload.storyId as string | undefined
      if (!storyId) {
        return Effect.fail(
          new Error("refresh_story requires a 'storyId' in payload")
        )
      }

      return Effect.gen(function* () {
        const story = yield* Effect.tryPromise({
          try: () => Effect.runPromise(storyRepo.findById(storyId)),
          catch: (cause: unknown) =>
            new Error(`Failed to fetch story: ${cause}`),
        })

        if (!story) return

        const url = payload.url as string | undefined
        if (!url) return

        const page = yield* Effect.tryPromise({
          try: () => Effect.runPromise(browser.fetchUrl(url)),
          catch: () => null,
        })

        if (!page) return

        const evidence = yield* Effect.tryPromise({
          try: () =>
            Effect.runPromise(
              evidenceRepo.create({
                source: "refresh",
                url,
                author: null,
                title: page.title,
                content: page.text.slice(0, 10_000),
                metadata: { refreshedBy: "worker", storyId },
                publishedAt: null,
              })
            ),
          catch: () => null,
        })

        if (evidence) {
          yield* Effect.tryPromise({
            try: () =>
              Effect.runPromise(storyRepo.addEvidence(storyId, evidence.id)),
            catch: () => {},
          })
        }
      }) as Effect.Effect<void, Error>
    },
  }
}
