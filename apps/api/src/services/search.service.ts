import { Context, Effect, Layer } from "effect"
import {
  StoryRepository,
  EvidenceRepository,
  JobRepository,
  ChatRepository,
} from "@weric/database"
import { GraphService } from "~api/services/graph.service"
import { jobBus } from "~api/lib/job-bus.ts"
import { defaultChatTitle } from "~api/controllers/chat.controller.ts"

import type { RepositoryError } from "@weric/database"
import type { StoryWithEvidenceCount, EvidenceSearchRow } from "@weric/database"
import type { ConceptGraph } from "@weric/contracts"

export interface SearchParams {
  q: string
  type: "all" | "stories" | "evidence"
  page: number
  limit: number
  chatId: string | undefined
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
  jobId: string | null
  chatId: string | null
  graph: ConceptGraph | null
}

export interface SearchServiceShape {
  readonly search: (
    params: SearchParams,
    userId: string | null
  ) => Effect.Effect<SearchResult, RepositoryError>
}

export class SearchService extends Context.Tag("SearchService")<
  SearchService,
  SearchServiceShape
>() {}

export const SearchServiceLive = Layer.effect(
  SearchService,
  Effect.gen(function* () {
    const storyRepo = yield* StoryRepository
    const evidenceRepo = yield* EvidenceRepository
    const jobRepo = yield* JobRepository
    const chatRepo = yield* ChatRepository
    const graphService = yield* GraphService

    return {
      search: (params, userId) =>
        Effect.gen(function* () {
          let storyResult: {
            data: StoryWithEvidenceCount[]
            total: number
          } | null = null
          let evidenceResult: {
            data: EvidenceSearchRow[]
            total: number
          } | null = null

          if (params.type === "all" || params.type === "stories") {
            storyResult = yield* storyRepo.searchStories(params.q, {
              page: params.page,
              limit: params.limit,
            })
          }

          if (params.type === "all" || params.type === "evidence") {
            evidenceResult = yield* evidenceRepo.searchEvidence(params.q, {
              page: params.page,
              limit: params.limit,
            })
          }

          let resolvedChatId: string | null = null
          try {
            if (params.chatId) {
              const chat = yield* chatRepo.findById(params.chatId)
              if (chat) resolvedChatId = chat.id
            } else {
              const chat = yield* chatRepo.create({
                title: defaultChatTitle(),
                query: params.q,
                userId: userId ?? null,
              })
              resolvedChatId = chat.id
            }
          } catch {}

          let jobId: string | null = null

          try {
            const job = yield* jobRepo.create({
              type: "search_discover",
              payload: { query: params.q, chatId: resolvedChatId },
            })
            jobId = job.id

            jobBus.sendJobToWorker({
              id: job.id,
              type: job.type,
              payload: job.payload,
            })
          } catch {}

          let graph: ConceptGraph | null = null
          if (resolvedChatId) {
            try {
              const g = yield* graphService.getGraph(resolvedChatId)
              graph = g.nodes.length > 0 ? g : null
            } catch {}
          }

          return {
            stories: storyResult?.data ?? [],
            evidence: (evidenceResult?.data ?? []).map(e => ({
              ...e,
              content: e.content.slice(0, 500),
            })),
            meta: {
              page: params.page,
              limit: params.limit,
              storyTotal: storyResult?.total ?? 0,
              evidenceTotal: evidenceResult?.total ?? 0,
            },
            jobId,
            chatId: resolvedChatId,
            graph,
          }
        }),
    }
  })
)
