import { Context, Effect, Layer } from "effect"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"

export interface HealthController {
  readonly check: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>
}

export const HealthController =
  Context.GenericTag<HealthController>("HealthController")

export const HealthControllerLive = Layer.effect(
  HealthController,
  Effect.gen(function* () {
    return {
      check: ctx =>
        Effect.sync(() =>
          ctx.json({
            status: "ok",
            version: "0.1.0",
            timestamp: new Date().toISOString(),
          })
        ),
    }
  })
)
