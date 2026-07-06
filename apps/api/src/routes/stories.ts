import { Hono } from "hono"
import { Effect } from "effect"
import { StoryRepository, EvidenceRepository } from "@weric/database"
import type { Db } from "@weric/database"
import { EvidenceSource } from "@weric/contracts"
import type { ApiVariables } from "../index.ts"

export function createStoriesRoutes(db: Db) {
  const router = new Hono<{ Variables: ApiVariables }>()
  const storyRepo = new StoryRepository(db)
  const evidenceRepo = new EvidenceRepository(db)

  router.get("/", async c => {
    const page = Math.max(1, Number(c.req.query("page") ?? 1))
    const limit = Math.min(100, Math.max(1, Number(c.req.query("limit") ?? 20)))
    const status = c.req.query("status") || undefined

    const { data, total } = await Effect.runPromise(
      storyRepo.findManyWithEvidenceCount({
        page,
        limit,
        status,
      })
    )

    return c.json({
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  })

  router.get("/:slug", async c => {
    const slug = c.req.param("slug")

    const detail = await Effect.runPromise(
      storyRepo.findBySlugWithDetails(slug)
    )

    if (!detail) {
      return c.json(
        {
          error: {
            code: "NOT_FOUND",
            message: `Story with slug '${slug}' not found`,
          },
        },
        404
      )
    }

    return c.json(detail)
  })

  router.post("/", async c => {
    const user = c.get("user")
    if (!user) {
      return c.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        401
      )
    }

    const body = await c.req.json()
    const sourceResult = EvidenceSource.safeParse(body.source ?? "manual")
    if (!sourceResult.success) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid source",
            details: sourceResult.error.flatten(),
          },
        },
        400
      )
    }

    const result = await Effect.runPromise(
      evidenceRepo.create({
        source: sourceResult.data,
        url: body.url,
        author: body.author ?? null,
        title: body.title,
        content: body.content,
        metadata: body.metadata ?? {},
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
      })
    )

    return c.json(
      {
        id: result.id,
        source: result.source,
        url: result.url,
        author: result.author ?? undefined,
        title: result.title,
        content: result.content,
        metadata: result.metadata,
        publishedAt:
          result.publishedAt instanceof Date
            ? result.publishedAt.toISOString()
            : undefined,
        discoveredAt:
          result.discoveredAt instanceof Date
            ? result.discoveredAt.toISOString()
            : String(result.discoveredAt),
      },
      201
    )
  })

  return router
}
