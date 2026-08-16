import { Context, Effect, Layer } from "effect"

/**
 * Materialises the service provided by a layer synchronously.
 *
 * Useful at route-construction time where a Hono factory wants a concrete
 * service handle (all requirements of `layer` must already be satisfied).
 *
 * The scope lives for the process lifetime — memoised layers are reused.
 */
export function buildLayer<Service>(layer: Layer.Layer<Service, never, never>) {
  return Effect.runSync(
    Effect.flatMap(Layer.toRuntime(layer).pipe(Effect.scoped), runtime =>
      Effect.promise(async () => runtime)
    )
  ) as unknown as {
    runEffect: <A, E>(effect: Effect.Effect<A, E, Service>) => Promise<A>
  } & object
}

/**
 * Extracts a service out of a fully-satisfied layer.
 * Returns the service implementation itself.
 */
export function serviceFromLayer<Service>(
  tag: Context.Tag<Service, Service>,
  layer: Layer.Layer<Service, never, never>
): Service {
  return Effect.runSync(
    Effect.gen(function* () {
      return yield* tag
    }).pipe(Effect.provide(layer))
  )
}
