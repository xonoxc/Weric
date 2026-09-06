import { Effect, Option, Schema } from "effect"
import { ChatService } from "~api/services/chat.service"
import { requireUser } from "~api/lib/validation"
import { parseReqBody } from "@weric/utils"
import { deOption } from "~api/lib/json"

import type { Optioned } from "@weric/utils"
import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"

const CreateChatRequest = Schema.Struct({
  query: Schema.optional(
    Schema.Trim.pipe(Schema.minLength(1), Schema.maxLength(500))
  ),
})

const ChatIdParam = Schema.Struct({
  id: Schema.String.pipe(Schema.minLength(1)),
})

export interface ChatControllerShape {
  readonly list: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>

  readonly create: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>

  readonly getById: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>

  readonly remove: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>
}

export class ChatController extends Effect.Service<ChatControllerShape>()(
  "ChatController",
  {
    effect: Effect.gen(function* () {
      const service = yield* ChatService

      const owned = (
        chat: Optioned<{ userId: string | null }>,
        user: { id: string }
      ): boolean => Option.isSome(chat) && chat.value.userId === user.id

      return {
        list: ctx =>
          Effect.gen(function* () {
            const user = requireUser(ctx)

            const data = yield* service.findByUser(user.id)

            return ctx.json({
              data,
              meta: {
                total: data.length,
              },
            })
          }),

        create: ctx =>
          Effect.gen(function* () {
            const user = requireUser(ctx)
            const rawBody = yield* parseReqBody(ctx.req)

            const body = Schema.decodeUnknownSync(CreateChatRequest)(rawBody)

            const chat = yield* service.create({
              title: defaultChatTitle(),
              query: Option.fromNullable(body.query),
              userId: Option.some(user.id),
            })

            return ctx.json(chat, 201)
          }),

        getById: ctx =>
          Effect.gen(function* () {
            const user = requireUser(ctx)
            const { id } = Schema.decodeUnknownSync(ChatIdParam)(
              ctx.req.param()
            )

            const chat = yield* service.findById(id)
            if (!owned(chat, user)) {
              return ctx.json(
                {
                  error: {
                    code: "NOT_FOUND",
                    message: "Chat not found",
                  },
                },
                404
              )
            }

            const detail = yield* service.findByIdWithStories(id)
            return ctx.json(deOption(detail))
          }),

        remove: ctx =>
          Effect.gen(function* () {
            const user = requireUser(ctx)
            const { id } = Schema.decodeUnknownSync(ChatIdParam)(
              ctx.req.param()
            )

            const chat = yield* service.findById(id)
            if (!owned(chat, user)) {
              return ctx.json(
                {
                  error: {
                    code: "NOT_FOUND",
                    message: "Chat not found",
                  },
                },
                404
              )
            }

            yield* service.delete(id)

            return ctx.json({
              ok: true,
            })
          }),
      } satisfies ChatControllerShape
    }),
  }
) {}

export const ChatControllerLive = ChatController.Default

export function defaultChatTitle(date = new Date()): string {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
