import { Effect, Layer } from "effect"
import { Context } from "hono"

export const effectHandler =
  <E, R>(
    effect: (ctx: Context) => Effect.Effect<Response, E, R>,
    layer: Layer.Layer<R, any, any>
  ) =>
  (ctx: Context) =>
    Effect.runPromise(
      effect(ctx).pipe(Effect.provide(layer as Layer.Layer<R, never, never>))
    )
