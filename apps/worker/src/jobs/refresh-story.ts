import { Effect, Data } from "effect"
import { BrowserService } from "@weric/browser"

import type { JobHandler } from "~worker/runtime.ts"
import type {
  StoryRepositoryShape,
  EvidenceRepositoryShape,
} from "@weric/database"

export function createRefreshStoryHandler(
  storyRepo: StoryRepositoryShape,
  evidenceRepo: EvidenceRepositoryShape,
  browser: BrowserService
): JobHandler {
  return {
    type: "refresh_story",

    handle(payload: Record<string, unknown>): Effect.Effect<void, Error> {
      const storyId = payload.storyId as string | undefined
      if (!storyId) {
        return Effect.fail(
          new StoryFetchError({
            storyId: storyId ?? "",
            cause: "Missing story id",
          })
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

class MissingStoryIdError extends Data.TaggedError("MissingStoryIdError")<{
  message: string
}> {}

class StoryFetchError extends Data.TaggedError("StoryFetchError")<{
  storyId: string
  cause: unknown
}> {}

class StoryRefreshError extends Data.TaggedError("StoryRefreshError")<{
  storyId: string
  url: string
  cause: unknown
}> {}
