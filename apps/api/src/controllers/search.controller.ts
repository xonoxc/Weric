import { Context, Effect, Layer, Schema } from "effect"
import { SearchService } from "~api/services/search.service"
import { ConceptGraphSchema } from "@weric/contracts"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"

import { PaginationQuery } from "~api/lib/validation"

const SearchQuery = PaginationQuery(100).pipe(
  Schema.extend(
    Schema.Struct({
      q: Schema.Trim.pipe(
        Schema.minLength(1, {
          message: () => "Query parameter 'q' is required",
        })
      ),
      type: Schema.optional(Schema.Literal("all", "stories", "evidence")).pipe(
        Schema.withDecodingDefault(() => "all" as const)
      ),
      chatId: Schema.optional(Schema.String),
    })
  )
)

const SearchResponse = Schema.Struct({
  stories: Schema.optional(Schema.Array(Schema.Unknown)),
  evidence: Schema.optional(Schema.Array(Schema.Unknown)),
  meta: Schema.Struct({
    page: Schema.Number,
    limit: Schema.Number,
    storyTotal: Schema.optional(Schema.Number),
    evidenceTotal: Schema.optional(Schema.Number),
  }),
  jobId: Schema.optional(Schema.NullOr(Schema.String)),
  chatId: Schema.optional(Schema.NullOr(Schema.String)),
  graph: Schema.optional(Schema.NullOr(ConceptGraphSchema)),
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
          const user = ctx.get("user")
          const parsed = Schema.decodeUnknownSync(SearchQuery)(ctx.req.query())

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

          return ctx.json(Schema.encode(SearchResponse)(result))
        }),
    }
  })
)
