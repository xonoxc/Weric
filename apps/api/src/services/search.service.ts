import { Effect, Option } from "effect"
import {
  StoryRepository,
  EvidenceRepository,
  JobRepository,
  ChatRepository,
} from "@weric/database"
import { GraphService } from "~api/services/graph.service"
import { JobBus } from "~api/lib/job-bus.ts"
import { defaultChatTitle } from "~api/controllers/chat.controller.ts"

import type { RepositoryError } from "@weric/database"
import type { StoryWithEvidenceCount, EvidenceSearchRow } from "@weric/database"
import type { ConceptGraph } from "@weric/contracts"
import type { Optioned } from "@weric/utils"

export interface SearchParams {
  q: string
  type: "all" | "stories" | "evidence"
  page: number
  limit: number
  chatId: Optioned<string>
}

export interface SearchResult {
  stories: unknown[]
  evidence: unknown[]
  meta: {
    page: number
    limit: number
    storyTotal: number
    evidenceTotal: number
  }
  jobId: Optioned<string>
  chatId: Optioned<string>
  graph: Optioned<ConceptGraph>
}

export interface SearchServiceShape {
  readonly search: (
    params: SearchParams,
    userId: Optioned<string>
  ) => Effect.Effect<SearchResult, RepositoryError>
}

export class SearchService extends Effect.Service<SearchServiceShape>()(
  "SearchService",
  {
    effect: Effect.gen(function* () {
      const storyRepo = yield* StoryRepository
      const evidenceRepo = yield* EvidenceRepository
      const jobRepo = yield* JobRepository
      const chatRepo = yield* ChatRepository
      const graphService = yield* GraphService
      const jobBus = yield* JobBus

      return {
        search: (params, userId) =>
          Effect.gen(function* () {
            let storyResult: Optioned<{
              data: StoryWithEvidenceCount[]
              total: number
            }> = Option.none()

            let evidenceResult: Optioned<{
              data: EvidenceSearchRow[]
              total: number
            }> = Option.none()

            if (params.type === "all" || params.type === "stories") {
              storyResult = Option.some(
                yield* storyRepo.searchStories(
                  params.q,
                  Option.some({
                    page: Option.some(params.page),
                    limit: Option.some(params.limit),
                  })
                )
              )
            }

            if (params.type === "all" || params.type === "evidence") {
              evidenceResult = Option.some(
                yield* evidenceRepo.searchEvidence(params.q, {
                  page: params.page,
                  limit: params.limit,
                })
              )
            }

            const resolvedChatId: Optioned<string> = yield* Option.match(
              params.chatId,
              {
                onSome: chatId =>
                  Effect.gen(function* () {
                    const chat = yield* chatRepo.findById(chatId)

                    return Option.map(chat, chat => chat.id)
                  }),

                onNone: () =>
                  Effect.gen(function* () {
                    const chat = yield* chatRepo.create({
                      title: defaultChatTitle(),
                      query: Option.some(params.q),
                      userId,
                    })

                    return Option.some(chat.id)
                  }),
              }
            )

            let jobId: Optioned<string> = yield* Option.match(resolvedChatId, {
              onSome: chatId =>
                Effect.gen(function* () {
                  const job = yield* jobRepo.create({
                    type: "search_discover",
                    payload: Option.some({
                      query: params.q,
                      chatId,
                    }),
                    scheduledAt: Option.none(),
                  })

                  yield* jobBus.publishWorker({
                    _tag: "new_job",
                    job: {
                      id: job.id,
                      type: job.type,
                      payload: job.payload,
                    },
                  })

                  return Option.some(job.id)
                }),

              onNone: () => Effect.succeed(Option.none()),
            })

            let graph: Optioned<ConceptGraph> = yield* Option.match(
              resolvedChatId,
              {
                onSome: chatId =>
                  Effect.gen(function* () {
                    const graph = yield* graphService.getGraph(chatId)

                    return graph.nodes.length > 0
                      ? Option.some(graph)
                      : Option.none()
                  }),

                onNone: () => Effect.succeed(Option.none()),
              }
            )

            const stories = Option.getOrElse(
              Option.map(storyResult, result => result.data),
              () => []
            )

            const evidence = Option.getOrElse(
              Option.map(evidenceResult, result =>
                result.data.map(ent => ({
                  ...ent,
                  content: ent.content.slice(0, 500),
                }))
              ),
              () => []
            )

            const storyTotal = Option.getOrElse(
              Option.map(storyResult, result => result.total),
              () => 0
            )

            const evidenceTotal = Option.getOrElse(
              Option.map(evidenceResult, result => result.total),
              () => 0
            )

            return {
              stories,
              evidence,
              meta: {
                page: params.page,
                limit: params.limit,
                storyTotal,
                evidenceTotal,
              },
              jobId,
              chatId: resolvedChatId,
              graph,
            }
          }),
      } satisfies SearchServiceShape
    }),
  }
) {}

export const SearchServiceLive = SearchService.Default
