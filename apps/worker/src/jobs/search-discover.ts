import { Effect } from "effect"
import {
  StoryRepository,
  EvidenceRepository,
  ChatRepository,
} from "@weric/database"
import { BrowserService } from "@weric/browser"
import { AIService } from "@weric/ai"

import type { FetchedPage } from "@weric/browser"
import type { Summary } from "@weric/ai"
import type { JobHandler } from "~worker/runtime.ts"

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "object" && error !== null) {
    const candidate = error as Record<string, unknown>
    if (typeof candidate.message === "string") return candidate.message
    if (candidate.cause !== undefined) return describeError(candidate.cause)
    try {
      return JSON.stringify(candidate)
    } catch {
      return String(candidate)
    }
  }
  return String(error)
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200)
}

export function createSearchDiscoverHandler(
  storyRepo: StoryRepository,
  evidenceRepo: EvidenceRepository,
  chatRepo: ChatRepository,
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

      const chatId = payload.chatId as string | undefined

      postProgress(jobId, { progress: 0.05, message: "Starting discovery..." })

      return Effect.gen(function* () {
        const failures: string[] = []
        const safe = <R, E>(desc: string, fx: Effect.Effect<R, E>) =>
          fx.pipe(
            Effect.catchAll(error => {
              failures.push(`${desc}: ${describeError(error)}`)
              return Effect.succeed(null as R | null)
            })
          )

        postProgress(jobId, { progress: 0.1, message: "Searching the web..." })

        const results = yield* safe(
          "web search",
          browser
            .searchWeb(query)
            .pipe(
              Effect.mapError(e => new Error(`Web search failed: ${e.message}`))
            )
        )

        if (!results || results.length === 0) {
          postProgress(jobId, {
            progress: 1,
            message: "No results found",
            status: "completed",
          })
          return
        }

        const total = Math.min(results.length, 5)
        let succeeded = 0

        const processResult = (
          result: (typeof results)[number],
          index: number
        ): Effect.Effect<void, never> => {
          const stepProgress = 0.15 + ((index + 1) / total) * 0.75
          const baseProgress = 0.15 + (index / total) * 0.75

          const report = (progress: number, message: string, extra?: object) =>
            postProgress(jobId, { progress, message, ...extra })

          return Effect.gen(function* () {
            report(baseProgress, `Fetching page ${index + 1}/${total}...`)

            const page = yield* safe(
              `fetch ${result.url}`,
              browser.fetchUrl(result.url)
            )
            if (!page) return

            report(
              baseProgress + 0.05,
              `Summarizing page ${index + 1}/${total}...`
            )

            const summary = yield* safe(
              `summarize "${page.title.slice(0, 60)}"`,
              ai.summarize(page.text)
            )

            const storySummary = summary?.summary ?? page.text.slice(0, 500)
            const slug = toSlug(page.title)

            const evidence = yield* safe(
              `create evidence ${result.url}`,
              evidenceRepo.create({
                source: "search_discover",
                url: result.url,
                author: null,
                title: page.title,
                content: page.text.slice(0, 10_000),
                metadata: { searchQuery: query, discoveredBy: "worker" },
                publishedAt: null,
              })
            )

            if (!evidence) return

            const existing = yield* safe(
              `lookup story "${slug}"`,
              storyRepo.findBySlug(slug)
            )

            if (existing) {
              yield* safe(
                `link evidence to story "${slug}"`,
                storyRepo.addEvidence(existing.id, evidence.id)
              )
              if (chatId) {
                yield* safe(
                  `link chat ${chatId} to story "${slug}"`,
                  chatRepo.addStory(chatId, existing.id)
                )
              }
              succeeded++
              report(
                stepProgress,
                `Linked evidence to existing story: ${page.title.slice(0, 60)}`
              )
            } else {
              const created = yield* safe(
                `create story "${slug}"`,
                storyRepo.create({
                  title: page.title,
                  slug,
                  summary: storySummary,
                  evidenceIds: [evidence.id],
                })
              )

              if (created) {
                if (chatId) {
                  yield* safe(
                    `link chat ${chatId} to story "${slug}"`,
                    chatRepo.addStory(chatId, created.id)
                  )
                }
                succeeded++
                report(stepProgress, `Discovered: ${page.title.slice(0, 60)}`, {
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
          })
        }

        yield* Effect.all(
          results
            .slice(0, total)
            .map((result, index) => processResult(result, index)),
          { concurrency: 5 }
        )

        if (succeeded === 0) {
          const first = failures[0] ?? "no results processed"
          console.error(
            `[search_discover ${jobId}] all ${total} source(s) failed. failures:`,
            failures
          )
          return yield* Effect.fail(new Error(`Discovery failed: ${first}`))
        }

        console.log(
          `[search_discover ${jobId}] discovered ${succeeded}/${total} source(s). failures:`,
          failures
        )

        postProgress(jobId, {
          progress: 1,
          message: `Discovery complete: ${succeeded} source${succeeded === 1 ? "" : "s"} discovered`,
          status: "completed",
        })
      })
    },
  }
}
