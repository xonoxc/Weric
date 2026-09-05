import { Effect } from "effect"
import { AuthService } from "~api/services/auth.service"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"

export interface AuthControllerShape {
  readonly handle: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>
}

export class AuthController extends Effect.Service<AuthControllerShape>()(
  "AuthController",
  {
    effect: Effect.gen(function* () {
      const { auth } = yield* AuthService

      return {
        handle: ctx =>
          Effect.tryPromise({
            try: () => auth.handler(ctx.req.raw),
            catch: cause => new Error(String(cause)),
          }),
      } satisfies AuthControllerShape
    }),
  }
) {}

export const AuthControllerLive = AuthController.Default
