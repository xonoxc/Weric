import type { ScoredStory } from "./scorer.ts"

const STOP_WORDS = new Set([
  "this",
  "that",
  "with",
  "from",
  "what",
  "when",
  "where",
  "which",
  "their",
  "about",
  "there",
  "would",
  "could",
  "should",
  "after",
  "before",
  "into",
  "over",
  "than",
  "then",
  "these",
  "those",
  "upon",
  "very",
  "was",
  "been",
  "have",
  "been",
  "were",
])

export class FeedDiversifier {
  diversify(scoredStories: ScoredStory[], count: number): ScoredStory[] {
    if (scoredStories.length <= count) return scoredStories

    const buckets = new Map<string, ScoredStory[]>()
    for (const s of scoredStories) {
      const topic = this.extractTopic(s.story.title)
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
  }

  private extractTopic(title: string): string {
    const words = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w))

    return words[0] ?? "general"
  }
}
