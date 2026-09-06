import { Option } from "effect"

export function deOption(value: unknown): unknown {
  if (Option.isOption(value)) {
    return Option.isSome(value) ? deOption(value.value) : null
  }
  if (Array.isArray(value)) {
    return value.map(deOption)
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        deOption(item),
      ])
    )
  }
  return value
}
