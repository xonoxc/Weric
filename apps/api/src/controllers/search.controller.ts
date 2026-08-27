import { Context, Effect, Layer } from "effect"
import { SearchService } from "~api/services/search.service"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"

import { z } from "zod"
import { PaginationQuery } from "~api/lib/validation"

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

export interface SearchController {
  readonly search: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>
}

export const SearchController =
  Context.GenericTag<SearchController>("SearchController")

export const SearchControllerLive = Layer.effect(
  SearchController,
  Effect.gen(function* () {
    const service = yield* SearchService

    return {
      search: ctx =>
        Effect.gen(function* () {
          const parsed = SearchQuery.parse(ctx.req.query())
          const user = ctx.get("user")

          const result = yield* service.search(
            {
              q: parsed.q,
              type: parsed.type,
              page: parsed.page,
              limit: parsed.limit,
              chatId: parsed.chatId,
            },
            user?.id ?? null
          )

          return ctx.json(SearchResponse.parse(result))
        }),
    }
  })
)
