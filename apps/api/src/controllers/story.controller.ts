import { Effect, Schema } from "effect"
import { StoryService, parseCreateEvidence } from "~api/services/story.service"
import { requireUser } from "~api/lib/validation"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"

import { PaginationQuery } from "~api/lib/validation"

const ListStoriesQuery = Schema.extend(
  PaginationQuery(100),
  Schema.Struct({
    status: Schema.optional(Schema.Literal("draft", "published", "archived")),
  })
)

const StorySlugParam = Schema.Struct({ slug: Schema.String })

export interface StoryControllerShape {
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

export class StoryController extends Effect.Service<StoryControllerShape>()(
  "StoryController",
  {
    effect: Effect.gen(function* () {
      const service = yield* StoryService

      return {
        list: ctx =>
          Effect.gen(function* () {
            const { page, limit, status } = Schema.decodeUnknownSync(
              ListStoriesQuery
            )(ctx.req.query())

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
            const { slug } = Schema.decodeUnknownSync(StorySlugParam)(
              ctx.req.param()
            )

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
      } satisfies StoryControllerShape
    }),
  }
) {}

export const StoryControllerLive = StoryController.Default
