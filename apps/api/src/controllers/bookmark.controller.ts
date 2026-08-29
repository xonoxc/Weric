import { Context, Effect, Layer, Schema } from "effect"
import { BookmarkService } from "~api/services/bookmark.service"
import { requireUser } from "~api/lib/validation"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"

import { IsoDateString } from "~api/lib/validation"
import { CreateBookmarkInputSchema } from "@weric/contracts"

const BookmarkResponse = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  storyId: Schema.String,
  createdAt: IsoDateString,
})

const StoryIdParam = Schema.Struct({ storyId: Schema.UUID })

export interface BookmarkController {
  readonly list: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>

  readonly create: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>

  readonly remove: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>
}

export const BookmarkController =
  Context.GenericTag<BookmarkController>("BookmarkController")

export const BookmarkControllerLive = Layer.effect(
  BookmarkController,
  Effect.gen(function* () {
    const service = yield* BookmarkService

    return {
      list: ctx =>
        Effect.gen(function* () {
          const user = requireUser(ctx)

          const data = yield* service.listByUser(user.id)

          return ctx.json({ data })
        }),

      create: ctx =>
        Effect.gen(function* () {
          const user = requireUser(ctx)

          const rawBody = yield* Effect.tryPromise({
            try: () => ctx.req.json(),
            catch: cause => new Error(String(cause)),
          })

          const { storyId } = Schema.decodeUnknownSync(
            CreateBookmarkInputSchema
          )(rawBody)

          const result = yield* service.create(user.id, storyId)

          return ctx.json(Schema.encodeSync(BookmarkResponse)(result), 201)
        }),

      remove: ctx =>
        Effect.gen(function* () {
          const user = requireUser(ctx)

          const { storyId } = Schema.decodeUnknownSync(StoryIdParam)(
            ctx.req.param()
          )

          yield* service.remove(user.id, storyId)

          return ctx.json({ success: true })
        }),
    }
  })
)
