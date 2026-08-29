import { Context, Effect, Layer, Schema } from "effect"
import { InterestError, InterestService } from "~api/services/interest.service"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"
import { requireUser } from "~api/lib/validation"
import { CreateInterestsRequestSchema } from "packages/contracts/src"

export interface InterestController {
  readonly get: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, InterestError>

  readonly set: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, InterestError>
}

export const InterestController =
  Context.GenericTag<InterestController>("InterestController")

export const InterestControllerLive = Layer.effect(
  InterestController,
  Effect.gen(function* () {
    const service = yield* InterestService

    return {
      get: ctx =>
        Effect.gen(function* () {
          const user = requireUser(ctx)

          const data = yield* service.getUserInterests(user.id)

          return ctx.json({ data })
        }),

      set: ctx =>
        Effect.gen(function* () {
          const user = requireUser(ctx)

          const body = yield* Effect.tryPromise({
            try: () => ctx.req.json(),
            catch: cause =>
              new InterestError({
                cause,
              }),
          })

          const { topics } = Schema.decodeUnknownSync(
            CreateInterestsRequestSchema
          )(body)

          const data = yield* service.setInterests(user.id, [...topics])

          return ctx.json({ data }, 201)
        }),
    }
  })
)
