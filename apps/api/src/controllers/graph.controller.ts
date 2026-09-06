import { Effect, Option, Schema } from "effect"
import { GraphService } from "~api/services/graph.service"
import { ChatService } from "~api/services/chat.service"
import { requireUser } from "~api/lib/validation"
import { ConceptGraphSchema } from "@weric/contracts"

import type { Optioned } from "@weric/utils"
import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"

const ChatIdParam = Schema.Struct({
  id: Schema.String.pipe(Schema.minLength(1)),
})

export interface GraphControllerShape {
  readonly getById: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>
}

export class GraphController extends Effect.Service<GraphControllerShape>()(
  "GraphController",
  {
    effect: Effect.gen(function* () {
      const graphService = yield* GraphService
      const chatService = yield* ChatService

      const owned = (
        chat: Optioned<{ userId: string | null }>,
        user: { id: string }
      ): boolean => Option.isSome(chat) && chat.value.userId === user.id

      return {
        getById: ctx =>
          Effect.gen(function* () {
            const user = requireUser(ctx)
            const { id } = Schema.decodeUnknownSync(ChatIdParam)(
              ctx.req.param()
            )

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
      } satisfies GraphControllerShape
    }),
  }
) {}

export const GraphControllerLive = GraphController.Default
