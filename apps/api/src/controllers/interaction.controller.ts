import { Context, Effect, Layer } from "effect"
import { InteractionService } from "~api/services/interaction.service"
import { requireUser } from "~api/lib/validation"

import { IsoDateString } from "~api/lib/validation"
import { CreateInteractionInputSchema, InteractionType } from "@weric/contracts"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"
import { z } from "zod"

const InteractionResponse = z.object({
  id: z.string(),
  userId: z.string(),
  storyId: z.string(),
  interactionType: InteractionType,
  duration: z
    .number()
    .nullable()
    .transform(value => value ?? undefined),
  createdAt: IsoDateString,
})

export interface InteractionController {
  readonly create: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>
}

export const InteractionController = Context.GenericTag<InteractionController>(
  "InteractionController"
)

export const InteractionControllerLive = Layer.effect(
  InteractionController,
  Effect.gen(function* () {
    const service = yield* InteractionService

    return {
      create: ctx =>
        Effect.gen(function* () {
          const user = requireUser(ctx)
          const body = CreateInteractionInputSchema.parse(
            yield* Effect.tryPromise({
              try: () => ctx.req.json(),
              catch: cause => new Error(String(cause)),
            })
          )

          const result = yield* service.create({
            userId: user.id,
            storyId: body.storyId,
            interactionType: body.interactionType,
            duration: body.duration ?? null,
          })

          return ctx.json(InteractionResponse.parse(result), 201)
        }),
    }
  })
)
