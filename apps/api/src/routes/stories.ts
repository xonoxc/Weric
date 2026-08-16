import { Hono } from "hono"
import { Effect } from "effect"
import { StoryRepository, EvidenceRepository } from "@weric/database"
import {
  CreateEvidenceInputSchema,
  EvidenceSource,
  EvidenceMetadataSchema,
} from "@weric/contracts"
import { z } from "zod"
import {
  IsoDateString,
  PaginationQuery,
  requireUser,
} from "~api/lib/validation.ts"

import type { Db } from "@weric/database"
import type { ApiVariables } from "~api/app.ts"

const ListStoriesQuery = PaginationQuery(100).extend({
  status: z.enum(["draft", "published", "archived"]).optional(),
})

const CreateEvidenceRequest = CreateEvidenceInputSchema.extend({
  source: EvidenceSource.optional(),
}).transform(data => ({
  ...data,
  source: data.source ?? ("manual" as const),
  publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
}))

const EvidenceResponse = z.object({
  id: z.string(),
  source: EvidenceSource,
  url: z.string(),
  author: z
    .string()
    .nullable()
    .transform(author => author ?? undefined),
  title: z.string(),
  content: z.string(),
  metadata: EvidenceMetadataSchema,
  publishedAt: z
    .date()
    .nullable()
    .transform(value => (value ? value.toISOString() : undefined)),
  discoveredAt: IsoDateString,
})

const StorySlugParam = z.object({ slug: z.string().min(1) })

export function createStoriesRoutes(db: Db) {
  const router = new Hono<{ Variables: ApiVariables }>()
  const storyRepo = new StoryRepository(db)
  const evidenceRepo = new EvidenceRepository(db)

  router.get("/", async c => {
    const { page, limit, status } = ListStoriesQuery.parse(c.req.query())

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
    const { slug } = StorySlugParam.parse(c.req.param())

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
    const user = requireUser(c)
    const body = CreateEvidenceRequest.parse(await c.req.json())

    const result = await Effect.runPromise(evidenceRepo.create(body))

    return c.json(EvidenceResponse.parse(result), 201)
  })

  return router
}
