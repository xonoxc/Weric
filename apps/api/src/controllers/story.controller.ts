import { Context, Effect, Layer } from "effect"
import { StoryService, parseCreateEvidence } from "~api/services/story.service"
import { requireUser } from "~api/lib/validation"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"

import { z } from "zod"
import { PaginationQuery } from "~api/lib/validation"

const ListStoriesQuery = PaginationQuery(100).extend({
  status: z.enum(["draft", "published", "archived"]).optional(),
})

const StorySlugParam = z.object({ slug: z.string().min(1) })

export interface StoryController {
  readonly list: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>

  readonly getBySlug: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>

  readonly createEvidence: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>
}

export const StoryController =
  Context.GenericTag<StoryController>("StoryController")

export const StoryControllerLive = Layer.effect(
  StoryController,
  Effect.gen(function* () {
    const service = yield* StoryService

    return {
      list: ctx =>
        Effect.gen(function* () {
          const { page, limit, status } = ListStoriesQuery.parse(
            ctx.req.query()
          )

          const { data, total } = yield* service.listStories({
            page,
            limit,
            status,
          })

          return ctx.json({
            data,
            meta: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          })
        }),

      getBySlug: ctx =>
        Effect.gen(function* () {
          const { slug } = StorySlugParam.parse(ctx.req.param())

          const detail = yield* service.getStoryBySlug(slug)
          if (!detail) {
            return ctx.json(
              {
                error: {
                  code: "NOT_FOUND",
                  message: `Story with slug '${slug}' not found`,
                },
              },
              404
            )
          }

          return ctx.json(detail)
        }),

      createEvidence: ctx =>
        Effect.gen(function* () {
          requireUser(ctx)
          const raw = yield* Effect.tryPromise({
            try: () => ctx.req.json(),
            catch: cause => new Error(String(cause)),
          })

          const input = parseCreateEvidence(raw)

          const result = yield* service.createEvidence(input)

          return ctx.json(result, 201)
        }),
    }
  })
)
