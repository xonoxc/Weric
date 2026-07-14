import { Hono } from "hono"
import { Effect } from "effect"
import {
  StoryRepository,
  EvidenceRepository,
  JobRepository,
} from "@weric/database"
import type { StoryWithEvidenceCount, EvidenceSearchRow } from "@weric/database"
import type { Db } from "@weric/database"
import type { ApiVariables } from "../index.ts"
import { jobBus } from "../lib/job-bus.ts"

export function createSearchRoutes(db: Db) {
  const router = new Hono<{ Variables: ApiVariables }>()
  const storyRepo = new StoryRepository(db)
  const evidenceRepo = new EvidenceRepository(db)
  const jobRepo = new JobRepository(db)

  router.get("/", async c => {
    const query = c.req.query("q")
    if (!query || query.trim().length === 0) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Query parameter 'q' is required",
          },
        },
        400
      )
    }

    const type = c.req.query("type") ?? "all"
    const page = Math.max(1, Number(c.req.query("page") ?? 1))
    const limit = Math.min(100, Math.max(1, Number(c.req.query("limit") ?? 20)))

    let storyResult: { data: StoryWithEvidenceCount[]; total: number } | null =
      null
    let evidenceResult: { data: EvidenceSearchRow[]; total: number } | null =
      null

    if (type === "all" || type === "stories") {
      storyResult = await Effect.runPromise(
        storyRepo.searchStories(query.trim(), { page, limit })
      )
    }

    if (type === "all" || type === "evidence") {
      evidenceResult = await Effect.runPromise(
        evidenceRepo.searchEvidence(query.trim(), { page, limit })
      )
    }

    let jobId: string | null = null

    try {
      const job = await Effect.runPromise(
        jobRepo.create({
          type: "search_discover",
          payload: { query: query.trim() },
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

    return c.json({
      stories: storyResult?.data ?? [],
      evidence: (evidenceResult?.data ?? []).map(e => ({
        ...e,
        content: e.content.slice(0, 500),
      })),
      meta: {
        page,
        limit,
        storyTotal: storyResult?.total ?? 0,
        evidenceTotal: evidenceResult?.total ?? 0,
      },
      jobId,
    })
  })

  return router
}
