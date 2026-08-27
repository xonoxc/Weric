import { Context, Effect, Layer } from "effect"
import { AuthService } from "~api/services/auth.service"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"

export interface AuthController {
  readonly handle: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>
}

export const AuthController =
  Context.GenericTag<AuthController>("AuthController")

export const AuthControllerLive = Layer.effect(
  AuthController,
  Effect.gen(function* () {
    const { auth } = yield* AuthService

    return {
      handle: ctx =>
        Effect.tryPromise({
          try: () => auth.handler(ctx.req.raw),
          catch: cause => new Error(String(cause)),
        }),
    }
  })
)
