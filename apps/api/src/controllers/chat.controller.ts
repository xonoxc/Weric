import { Context, Effect, Layer } from "effect"
import { ChatService } from "~api/services/chat.service"
import { requireUser } from "~api/lib/validation"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"
import type { RepositoryError } from "@weric/database"

import { z } from "zod"

const CreateChatRequest = z.object({
  query: z.string().trim().min(1).max(500).optional(),
})

const ChatIdParam = z.object({ id: z.string().min(1) })

export interface ChatController {
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

export const ChatController =
  Context.GenericTag<ChatController>("ChatController")

export const ChatControllerLive = Layer.effect(
  ChatController,
  Effect.gen(function* () {
    const service = yield* ChatService

    const owned = (
      chat: { userId: string | null } | null,
      user: { id: string }
    ): boolean => !!chat && chat.userId === user.id

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
          const body = CreateChatRequest.parse(
            yield* Effect.tryPromise({
              try: () => ctx.req.json(),
              catch: cause => new Error(String(cause)),
            })
          )

          const chat = yield* service.create({
            title: defaultChatTitle(),
            query: body.query ?? null,
            userId: user.id,
          })

          return ctx.json(chat, 201)
        }),

      getById: ctx =>
        Effect.gen(function* () {
          const user = requireUser(ctx)
          const { id } = ChatIdParam.parse(ctx.req.param())

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
          return ctx.json(detail)
        }),

      remove: ctx =>
        Effect.gen(function* () {
          const user = requireUser(ctx)
          const { id } = ChatIdParam.parse(ctx.req.param())

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
          return ctx.json({ ok: true })
        }),
    }
  })
)

export function defaultChatTitle(date = new Date()): string {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
