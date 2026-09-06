import { Effect } from "effect"

export interface JsonBodySource {
  json(): Promise<unknown>
}

export function parseReqBody<TBody = unknown>(
  source: JsonBodySource
): Effect.Effect<TBody, Error> {
  return Effect.tryPromise({
    try: () => source.json() as Promise<TBody>,
    catch: cause => new Error(String(cause)),
  })
}
