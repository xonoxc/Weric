import { Context, Effect, Layer } from "effect"
import { Context as HonoContext } from "hono"

import type { AppContext } from "./app-context"

export const buildRouteContext = <R, E, RIn>(
  layer: Layer.Layer<R, E, RIn>,
  base: AppContext
): Context.Context<R> =>
  Effect.runSync(
    Layer.build(layer).pipe(
      Effect.provide(base as unknown as Context.Context<RIn>),
      Effect.scoped
    )
  )

export const effectHandler =
  <E, R>(
    effect: (ctx: HonoContext) => Effect.Effect<Response, E, R>,
    context: Context.Context<R>
  ) =>
  (ctx: HonoContext) =>
    Effect.runPromise(effect(ctx).pipe(Effect.provide(context)))
