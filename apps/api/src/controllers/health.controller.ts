import { Effect } from "effect"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"

export interface HealthControllerShape {
  readonly check: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>
}

export class HealthController extends Effect.Service<HealthControllerShape>()(
  "HealthController",
  {
    effect: Effect.gen(function* () {
      return {
        check: ctx =>
          Effect.sync(() =>
            ctx.json({
              status: "ok",
              version: "0.1.0",
              timestamp: new Date().toISOString(),
            })
          ),
      } satisfies HealthControllerShape
    }),
  }
) {}

export const HealthControllerLive = HealthController.Default
