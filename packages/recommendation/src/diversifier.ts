import { Context, Layer } from "effect"
import { STOP_WORDS } from "@weric/shared"

import type { ScoredStory } from "./scorer.ts"

export interface FeedDiversifier {
  readonly diversify: (
    scoredStories: ScoredStory[],
    count: number
  ) => ScoredStory[]
}

export const FeedDiversifier =
  Context.GenericTag<FeedDiversifier>("FeedDiversifier")

export const FeedDiversifierLive = Layer.succeed(FeedDiversifier, {
  diversify(scoredStories, count) {
    if (scoredStories.length <= count) return scoredStories

    const buckets = new Map<string, ScoredStory[]>()
    for (const s of scoredStories) {
      const topic = extractTopic(s.story.title)
      if (!buckets.has(topic)) buckets.set(topic, [])
      buckets.get(topic)!.push(s)
    }

    const result: ScoredStory[] = []
    const keys = [...buckets.keys()]
    const bucketIndexes = new Map<string, number>()
    for (const k of keys) bucketIndexes.set(k, 0)

    while (result.length < count) {
      let picked = false
      for (const key of keys) {
        const bucket = buckets.get(key)!
        const idx = bucketIndexes.get(key)!
        if (idx < bucket.length) {
          result.push(bucket[idx]!)
          bucketIndexes.set(key, idx + 1)
          picked = true
          if (result.length >= count) break
        }
      }
      if (!picked) break
    }

    return result
  },
})

function extractTopic(title: string): string {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w))

  return words[0] ?? "general"
}
