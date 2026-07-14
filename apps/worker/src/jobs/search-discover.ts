import { Effect } from "effect"
import { StoryRepository, EvidenceRepository } from "@weric/database"
import { BrowserService } from "@weric/browser"
import type { FetchedPage } from "@weric/browser"
import { AIService } from "@weric/ai"
import type { Summary } from "@weric/ai"
import type { JobHandler } from "../runtime.ts"

export function createSearchDiscoverHandler(
  storyRepo: StoryRepository,
  evidenceRepo: EvidenceRepository,
  browser: BrowserService,
  ai: AIService,
  apiUrl: string
): JobHandler {
  function postProgress(jobId: string, data: Record<string, unknown>): void {
    fetch(`${apiUrl}/internal/job-progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, ...data }),
    }).catch(() => {})
  }

  return {
    type: "search_discover",

    handle(
      payload: Record<string, unknown>,
      jobId: string
    ): Effect.Effect<void, Error> {
      const query = payload.query as string | undefined
      if (!query || query.trim().length === 0) {
        return Effect.fail(
          new Error("search_discover requires a 'query' in payload")
        )
      }

      postProgress(jobId, {
        progress: 0.05,
        message: "Starting discovery...",
      })

      return Effect.gen(function* () {
        postProgress(jobId, {
          progress: 0.1,
          message: "Searching Hacker News...",
        })

        const results = yield* browser
          .searchWeb(query)
          .pipe(
            Effect.mapError(e => new Error(`Web search failed: ${e.message}`))
          )

        if (results.length === 0) {
          postProgress(jobId, {
            progress: 1,
            message: "No results found",
            status: "completed",
          })
          return
        }

        const total = Math.min(results.length, 5)
        const progressStart = 0.15
        const progressRange = 0.75

        for (let i = 0; i < total; i++) {
          const result = results[i]
          if (!result) continue

          const stepProgress = progressStart + ((i + 1) / total) * progressRange

          postProgress(jobId, {
            progress: progressStart + (i / total) * progressRange,
            message: `Fetching page ${i + 1}/${total}...`,
          })

          const page = yield* browser
            .fetchUrl(result.url)
            .pipe(
              Effect.catchAll(() => Effect.succeed(null as FetchedPage | null))
            )

          if (!page) continue

          postProgress(jobId, {
            progress: progressStart + (i / total) * progressRange + 0.05,
            message: `Summarizing page ${i + 1}/${total}...`,
          })

          const summary = yield* ai
            .summarize(page.text)
            .pipe(Effect.catchAll(() => Effect.succeed(null as Summary | null)))

          if (!summary) continue

          const slug = page.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 200)

          const evidence = yield* evidenceRepo
            .create({
              source: "search_discover",
              url: result.url,
              author: null,
              title: page.title,
              content: page.text.slice(0, 10_000),
              metadata: { searchQuery: query, discoveredBy: "worker" },
              publishedAt: null,
            })
            .pipe(Effect.catchAll(() => Effect.succeed(null)))

          if (!evidence) continue

          const existing = yield* storyRepo
            .findBySlug(slug)
            .pipe(Effect.catchAll(() => Effect.succeed(null)))

          if (existing) {
            yield* storyRepo
              .addEvidence(existing.id, evidence.id)
              .pipe(Effect.catchAll(() => Effect.void))

            postProgress(jobId, {
              progress: stepProgress,
              message: `Linked evidence to existing story: ${page.title.slice(0, 60)}`,
            })
          } else {
            const created = yield* storyRepo
              .create({
                title: page.title,
                slug,
                summary: summary?.summary ?? page.text.slice(0, 500),
                evidenceIds: [evidence.id],
              })
              .pipe(Effect.catchAll(() => Effect.succeed(null)))

            if (created) {
              postProgress(jobId, {
                progress: stepProgress,
                message: `Discovered: ${page.title.slice(0, 60)}`,
                stories: [
                  {
                    id: created.id,
                    title: created.title,
                    slug: created.slug,
                    summary: created.summary ?? "",
                    confidence: 0,
                  },
                ],
              })
            }
          }
        }

        postProgress(jobId, {
          progress: 1,
          message: "Discovery complete",
          status: "completed",
        })
      })
    },
  }
}
