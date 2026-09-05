import { Effect, Schema } from "effect"
import { InteractionService } from "~api/services/interaction.service"
import { requireUser } from "~api/lib/validation"

import { CreateInteractionInputSchema, InteractionType } from "@weric/contracts"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"

const InteractionResponse = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  storyId: Schema.String,
  interactionType: InteractionType,
  duration: Schema.optional(Schema.NullOr(Schema.Number)),
  createdAt: Schema.Date,
})

export interface InteractionControllerShape {
  readonly create: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>
}

export class InteractionController extends Effect.Service<InteractionControllerShape>()(
  "InteractionController",
  {
    effect: Effect.gen(function* () {
      const service = yield* InteractionService

      return {
        create: ctx =>
          Effect.gen(function* () {
            const user = requireUser(ctx)

            const reqBody = yield* Effect.tryPromise({
              try: () => ctx.req.json(),
              catch: cause => new Error(String(cause)),
            })

            const body = Schema.decodeUnknownSync(CreateInteractionInputSchema)(
              reqBody
            )

            const result = yield* service.create({
              userId: user.id,
              storyId: body.storyId,
              interactionType: body.interactionType,
              duration: body.duration ?? null,
            })

            return ctx.json(
              Schema.decodeUnknownSync(InteractionResponse)(result),
              201
            )
          }),
      } satisfies InteractionControllerShape
    }),
  }
) {}

export const InteractionControllerLive = InteractionController.Default
