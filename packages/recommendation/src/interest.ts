import { Effect } from "effect"
import type { StoryWithEvidenceCount } from "@weric/database"
import type { InterestRepository } from "@weric/database"
import { ScoringError } from "./errors.ts"
import type { RecommendationError } from "./errors.ts"

const INTERACTION_BOOST: Record<string, number> = {
  read: 0.05,
  read_complete: 0.1,
  click: 0.02,
  share: 0.2,
  save: 0.15,
  hide: -0.15,
}

const DECAY_FACTOR = 0.95
const MAX_TOPICS = 10

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
  "more",
  "some",
  "them",
  "than",
  "such",
  "only",
  "other",
  "just",
  "also",
  "than",
])

const BOOST_WORDS = new Set([
  "breakthrough",
  "discovery",
  "research",
  "study",
  "findings",
  "analysis",
  "report",
  "reveals",
  "shows",
  "found",
  "announced",
  "launched",
  "introduced",
  "unveiled",
])

const toScoringError = (message: string) => (cause: unknown) =>
  new ScoringError({ message, cause })

export interface TopicScore {
  topic: string
  score: number
}

export class InterestLearner {
  constructor(private readonly interestRepo: InterestRepository) {}

  extractTopics(story: StoryWithEvidenceCount): TopicScore[] {
    const titleWords = this.tokenize(story.title)
    const summaryWords = this.tokenize(story.summary)

    const wordScores = new Map<string, number>()

    for (const word of titleWords) {
      const boost = BOOST_WORDS.has(word) ? 2 : 1
      wordScores.set(word, (wordScores.get(word) ?? 0) + 0.3 * boost)
    }

    for (const word of summaryWords) {
      if (wordScores.has(word)) {
        wordScores.set(word, wordScores.get(word)! + 0.1)
      } else {
        wordScores.set(word, 0.1)
      }
    }

    return [...wordScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_TOPICS)
      .map(([topic, score]) => ({ topic, score: Math.min(1, score) }))
  }

  updateFromInteraction(
    userId: string,
    story: StoryWithEvidenceCount,
    interactionType: string
  ): Effect.Effect<void, RecommendationError> {
    const self = this
    return Effect.gen(function* () {
      const boost = INTERACTION_BOOST[interactionType]
      if (boost === undefined) return

      const topics = self.extractTopics(story)
      if (topics.length === 0) return

      const existing = yield* self.interestRepo
        .findByUserId(userId)
        .pipe(Effect.catchAll(toScoringError("Failed to fetch interests")))

      const existingMap = new Map(existing.map(i => [i.topic, i.score]))

      for (const { topic, score } of topics) {
        const current = existingMap.get(topic) ?? 0
        const updated = Math.max(
          0,
          Math.min(1, current * DECAY_FACTOR + score * boost)
        )

        yield* self.interestRepo
          .upsert(userId, topic, updated)
          .pipe(Effect.catchAll(toScoringError("Failed to upsert interest")))
      }
    })
  }

  decayAll(userId: string): Effect.Effect<void, RecommendationError> {
    const self = this
    return Effect.gen(function* () {
      const existing = yield* self.interestRepo
        .findByUserId(userId)
        .pipe(Effect.catchAll(toScoringError("Failed to fetch interests")))

      for (const interest of existing) {
        const decayed = interest.score * DECAY_FACTOR
        if (decayed < 0.01) {
          yield* self.interestRepo
            .deleteByTopic(userId, interest.topic)
            .pipe(Effect.catchAll(toScoringError("Failed to delete interest")))
        } else {
          yield* self.interestRepo
            .upsert(userId, interest.topic, decayed)
            .pipe(Effect.catchAll(toScoringError("Failed to upsert interest")))
        }
      }
    })
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w))
  }
}
