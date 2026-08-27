import { Context, Effect, Layer } from "effect"
import { FeedService } from "~api/services/feed.service"
import { requireUser } from "~api/lib/validation"
import { PaginationQuery } from "~api/lib/validation"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"
import type { Feed } from "@weric/contracts"

const FeedQuery = PaginationQuery(50)

export interface FeedController {
  readonly generate: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>
}

export const FeedController =
  Context.GenericTag<FeedController>("FeedController")

export const FeedControllerLive = Layer.effect(
  FeedController,
  Effect.gen(function* () {
    const service = yield* FeedService

    return {
      generate: ctx =>
        Effect.gen(function* () {
          const user = requireUser(ctx)
          const { page, limit } = FeedQuery.parse(ctx.req.query())

          const feed: Feed = yield* service.generateFeed(user.id, {
            page,
            limit,
          })

          return ctx.json(feed)
        }),
    }
  })
)
