import { Effect, Option } from "effect"
import { BrowserService } from "@weric/browser"
import { AIService } from "@weric/ai"
import { persistConceptGraph } from "~worker/graph.ts"

import type { JobHandler } from "~worker/runtime.ts"
import type {
  StoryRepositoryShape,
  EvidenceRepositoryShape,
  ChatRepositoryShape,
  ConceptRepositoryShape,
  ConceptEdgeRepositoryShape,
  ConceptStoryRepositoryShape,
} from "@weric/database"
import type { GraphPersistence, GraphConceptRow } from "~worker/graph.ts"
import type { FetchedPage } from "@weric/browser"
import type { Summary } from "@weric/ai"

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
  storyRepo: StoryRepositoryShape,
  evidenceRepo: EvidenceRepositoryShape,
  chatRepo: ChatRepositoryShape,
  conceptRepo: ConceptRepositoryShape,
  conceptEdgeRepo: ConceptEdgeRepositoryShape,
  conceptStoryRepo: ConceptStoryRepositoryShape,
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

        const safe = <R, E>(
          desc: string,
          fx: Effect.Effect<R, E>
        ): Effect.Effect<Option.Option<R>, never> =>
          fx.pipe(
            Effect.match({
              onFailure: error => {
                failures.push(`${desc}: ${describeError(error)}`)
                return Option.none<R>()
              },
              onSuccess: value => Option.some(value),
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

        if (Option.isNone(results) || results.value.length === 0) {
          postProgress(jobId, {
            progress: 1,
            message: "No results found",
            status: "completed",
          })
          return
        }

        const total = Math.min(results.value.length, 5)
        let succeeded = 0
        const discoveredStories: {
          id: string
          title: string
          summary: string
        }[] = []

        const processResult = (
          result: (typeof results.value)[number],
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
            if (Option.isNone(page)) return

            report(
              baseProgress + 0.05,
              `Summarizing page ${index + 1}/${total}...`
            )

            const summary = yield* safe(
              `summarize "${page.value.title.slice(0, 60)}"`,
              ai.summarize(page.value.text)
            )

            const storySummary = Option.getOrElse(
              Option.map(summary, s => s.summary),
              () => page.value.text.slice(0, 500)
            )
            const slug = toSlug(page.value.title)

            const evidence = yield* safe(
              `create evidence ${result.url}`,
              evidenceRepo.create({
                source: "search_discover",
                url: result.url,
                author: Option.none(),
                title: page.value.title,
                content: page.value.text.slice(0, 10_000),
                metadata: { searchQuery: query, discoveredBy: "worker" },
                publishedAt: Option.none(),
              })
            )

            if (Option.isNone(evidence)) return

            const existing = yield* safe(
              `lookup story "${slug}"`,
              storyRepo.findBySlug(slug)
            ).pipe(Effect.map(Option.flatten))

            if (Option.isSome(existing)) {
              yield* safe(
                `link evidence to story "${slug}"`,
                storyRepo.addEvidence(existing.value.id, evidence.value.id)
              )
              if (chatId) {
                yield* safe(
                  `link chat ${chatId} to story "${slug}"`,
                  chatRepo.addStory(chatId, existing.value.id)
                )
              }
              succeeded++
              discoveredStories.push({
                id: existing.value.id,
                title: existing.value.title,
                summary: existing.value.summary ?? "",
              })
              report(
                stepProgress,
                `Linked evidence to existing story: ${page.value.title.slice(0, 60)}`
              )
            } else {
              const created = yield* safe(
                `create story "${slug}"`,
                storyRepo.create({
                  title: page.value.title,
                  slug,
                  summary: Option.some(storySummary),
                  evidenceIds: [evidence.value.id],
                })
              )

              if (Option.isSome(created)) {
                if (chatId) {
                  yield* safe(
                    `link chat ${chatId} to story "${slug}"`,
                    chatRepo.addStory(chatId, created.value.id)
                  )
                }
                succeeded++
                discoveredStories.push({
                  id: created.value.id,
                  title: created.value.title,
                  summary: created.value.summary ?? "",
                })
                report(
                  stepProgress,
                  `Discovered: ${page.value.title.slice(0, 60)}`,
                  {
                    stories: [
                      {
                        id: created.value.id,
                        title: created.value.title,
                        slug: created.value.slug,
                        summary: created.value.summary ?? "",
                        confidence: 0,
                      },
                    ],
                  }
                )
              }
            }
          })
        }

        yield* Effect.all(
          results.value
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

        if (chatId && discoveredStories.length > 0) {
          postProgress(jobId, {
            progress: 0.92,
            message: "Distilling concept flow-graph...",
          })

          const synthesis = yield* safe(
            "synthesize concept graph",
            ai.synthesizeGraph({
              query,
              items: discoveredStories,
            })
          )

          if (Option.isSome(synthesis)) {
            const graphRepo: GraphPersistence = {
              createConcept: data =>
                conceptRepo.create(data).pipe(
                  Effect.map(
                    row =>
                      ({
                        ...row,
                        summary: Option.fromNullable(row.summary),
                        positionX: Option.fromNullable(row.positionX),
                        positionY: Option.fromNullable(row.positionY),
                      }) as GraphConceptRow
                  )
                ),
              createEdge: data => conceptEdgeRepo.create(data),
              linkStory: (conceptId, storyId) =>
                conceptStoryRepo.link(conceptId, storyId),
            }

            const graph = yield* safe(
              "persist concept graph",
              persistConceptGraph(chatId, synthesis.value, graphRepo)
            )

            if (Option.isSome(graph)) {
              postProgress(jobId, { progress: 0.97, graph: graph.value })
            }
          }
        }

        postProgress(jobId, {
          progress: 1,
          message: `Discovery complete: ${succeeded} source${succeeded === 1 ? "" : "s"} discovered`,
          status: "completed",
        })
      })
    },
  }
}
