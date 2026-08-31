import { Context, Effect, Layer, Schema } from "effect"
import { GraphService } from "~api/services/graph.service"
import { ChatService } from "~api/services/chat.service"
import { requireUser } from "~api/lib/validation"
import { ConceptGraphSchema } from "@weric/contracts"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"

const ChatIdParam = Schema.Struct({
  id: Schema.String.pipe(Schema.minLength(1)),
})

export interface GraphController {
  readonly getById: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>
}

export const GraphController =
  Context.GenericTag<GraphController>("GraphController")

export const GraphControllerLive = Layer.effect(
  GraphController,
  Effect.gen(function* () {
    const graphService = yield* GraphService
    const chatService = yield* ChatService

    const owned = (
      chat: { userId: string | null } | null,
      user: { id: string }
    ): boolean => !!chat && chat.userId === user.id

    return {
      getById: ctx =>
        Effect.gen(function* () {
          const user = requireUser(ctx)
          const { id } = Schema.decodeUnknownSync(ChatIdParam)(ctx.req.param())

          const chat = yield* chatService.findById(id)
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

          const graph = yield* graphService.getGraph(id)
          return ctx.json(Schema.encode(ConceptGraphSchema)(graph))
        }),
    }
  })
)
