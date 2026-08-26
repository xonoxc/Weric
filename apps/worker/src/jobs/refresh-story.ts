import { Effect } from "effect"
import { StoryRepository, EvidenceRepository } from "@weric/database"
import { BrowserService } from "@weric/browser"

import type { JobHandler } from "~worker/runtime.ts"

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
        const story = yield* storyRepo
          .findById(storyId)
          .pipe(
            Effect.mapError(
              () => new Error("Failed to fetch story with id: " + storyId)
            )
          )

        if (!story) return

        const url = payload.url as string | undefined
        if (!url) return

        const page = yield* browser
          .fetchUrl(url)
          .pipe(Effect.catchAll(() => Effect.succeed(null)))

        if (!page) return

        const evidence = yield* evidenceRepo
          .create({
            source: "refresh",
            url,
            author: null,
            title: page.title,
            content: page.text.slice(0, 10_000),
            metadata: { refreshedBy: "worker", storyId },
            publishedAt: null,
          })
          .pipe(Effect.catchAll(() => Effect.succeed(null)))

        if (evidence) {
          yield* storyRepo
            .addEvidence(storyId, evidence.id)
            .pipe(Effect.catchAll(() => Effect.succeed(undefined)))
        }
      }) as Effect.Effect<void, Error>
    },
  }
}
