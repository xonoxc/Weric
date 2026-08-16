import { Hono } from "hono"
import { Effect } from "effect"
import {
  StoryRepository,
  EvidenceRepository,
  JobRepository,
  ChatRepository,
} from "@weric/database"
import { z } from "zod"
import { jobBus } from "~api/lib/job-bus.ts"
import { PaginationQuery } from "~api/lib/validation.ts"
import { defaultChatTitle } from "./chats.ts"

import type { StoryWithEvidenceCount, EvidenceSearchRow } from "@weric/database"
import type { Db } from "@weric/database"
import type { ApiVariables } from "~api/app.ts"

const SearchQuery = PaginationQuery(100).extend({
  q: z.string().trim().min(1, "Query parameter 'q' is required"),
  type: z.enum(["all", "stories", "evidence"]).default("all"),
  chatId: z.string().optional(),
})

const SearchResponse = z.object({
  stories: z.array(z.unknown()).default([]),
  evidence: z.array(z.unknown()).default([]),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    storyTotal: z.number().default(0),
    evidenceTotal: z.number().default(0),
  }),
  jobId: z.string().nullable().default(null),
  chatId: z.string().nullable().default(null),
})

export function createSearchRoutes(db: Db) {
  const router = new Hono<{ Variables: ApiVariables }>()
  const storyRepo = new StoryRepository(db)
  const evidenceRepo = new EvidenceRepository(db)
  const jobRepo = new JobRepository(db)
  const chatRepo = new ChatRepository(db)

  router.get("/", async c => {
    const { q, type, page, limit, chatId } = SearchQuery.parse(c.req.query())

    let storyResult: { data: StoryWithEvidenceCount[]; total: number } | null =
      null
    let evidenceResult: { data: EvidenceSearchRow[]; total: number } | null =
      null

    if (type === "all" || type === "stories") {
      storyResult = await Effect.runPromise(
        storyRepo.searchStories(q, { page, limit })
      )
    }

    if (type === "all" || type === "evidence") {
      evidenceResult = await Effect.runPromise(
        evidenceRepo.searchEvidence(q, { page, limit })
      )
    }

    const user = c.get("user")

    // Resolve the chat this search belongs to. A search always happens inside
    // a chat (session) so results persist and can be revisited later.
    let resolvedChatId: string | null = null
    try {
      if (chatId) {
        const chat = await Effect.runPromise(chatRepo.findById(chatId))
        if (chat) resolvedChatId = chat.id
      } else {
        const chat = await Effect.runPromise(
          chatRepo.create({
            title: defaultChatTitle(),
            query: q,
            userId: user?.id ?? null,
          })
        )
        resolvedChatId = chat.id
      }
    } catch {
      // Chat resolution is non-fatal — results still return
    }

    let jobId: string | null = null

    try {
      const job = await Effect.runPromise(
        jobRepo.create({
          type: "search_discover",
          payload: { query: q, chatId: resolvedChatId },
        })
      )
      jobId = job.id

      jobBus.sendJobToWorker({
        id: job.id,
        type: job.type,
        payload: job.payload,
      })
    } catch {
      // Job creation failure is non-fatal — results still return
    }

    return c.json(
      SearchResponse.parse({
        stories: storyResult?.data,
        evidence: (evidenceResult?.data ?? []).map(e => ({
          ...e,
          content: e.content.slice(0, 500),
        })),
        meta: {
          page,
          limit,
          storyTotal: storyResult?.total,
          evidenceTotal: evidenceResult?.total,
        },
        jobId,
        chatId: resolvedChatId,
      })
    )
  })

  return router
}
