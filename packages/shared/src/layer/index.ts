import { Context, Layer } from "effect"

export function mergeAllLayers<RI, E, RO>(
  ...layers: Array<Layer.Layer<RI, E, RO>>
): Layer.Layer<RI, E, RO> {
  return layers.reduce(
    (acc, layer) => Layer.merge(acc, layer) as Layer.Layer<RI, E, RO>,
    Layer.succeedContext(Context.empty()) as unknown as Layer.Layer<RI, E, RO>
  )
}

export function createTestLayer<R, E>(layer: Layer.Layer<R, E>): Layer.Layer<R, E> {
  return layer
}
