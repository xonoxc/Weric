import { Effect, Schema } from "effect"
import { InterestError, InterestService } from "~api/services/interest.service"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"
import { requireUser } from "~api/lib/validation"
import { CreateInterestsRequestSchema } from "packages/contracts/src"

export interface InterestControllerShape {
  readonly get: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, InterestError>

  readonly set: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, InterestError>
}

export class InterestController extends Effect.Service<InterestControllerShape>()(
  "InterestController",
  {
    effect: Effect.gen(function* () {
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
      } satisfies InterestControllerShape
    }),
  }
) {}

export const InterestControllerLive = InterestController.Default
