import { Effect } from "effect"
import { ProfileService } from "~api/services/profile.service"
import { requireUser } from "~api/lib/validation"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"

export interface ProfileControllerShape {
  readonly get: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>
}

export class ProfileController extends Effect.Service<ProfileControllerShape>()(
  "ProfileController",
  {
    effect: Effect.gen(function* () {
      const service = yield* ProfileService

      return {
        get: ctx =>
          Effect.gen(function* () {
            const user = requireUser(ctx)

            const profile = yield* service.getProfile(user)

            return ctx.json(profile)
          }),
      } satisfies ProfileControllerShape
    }),
  }
) {}

export const ProfileControllerLive = ProfileController.Default
