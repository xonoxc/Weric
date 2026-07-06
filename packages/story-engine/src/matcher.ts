import { Effect } from "effect"
import type { StoryRepository } from "@weric/database"
import { MatchError } from "./errors.ts"
import type { StoryError } from "./errors.ts"
import type { NormalizedDocument } from "./normalizer.ts"

export interface MatchResult {
  storyId: string
  title: string
  confidence: number
}

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2)
  return new Set(words)
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter(x => b.has(x)))
  const union = new Set([...a, ...b])
  if (union.size === 0) return 0
  return intersection.size / union.size
}

function titleSimilarity(
  evidence: NormalizedDocument,
  storyTitle: string
): number {
  const evTitle = tokenize(evidence.title)
  const stTitle = tokenize(storyTitle)
  return jaccardSimilarity(evTitle, stTitle)
}

function contentSimilarity(
  evidence: NormalizedDocument,
  storySummary: string | null
): number {
  const evContent = tokenize(
    evidence.title + " " + evidence.content.slice(0, 1000)
  )
  const stContent = tokenize(storySummary ?? "")
  return jaccardSimilarity(evContent, stContent)
}

const MIN_TITLE_SIMILARITY = 0.15
const MIN_CONTENT_SIMILARITY = 0.1

export class StoryMatcher {
  constructor(private readonly storyRepo: StoryRepository) {}

  findMatches(
    evidence: NormalizedDocument
  ): Effect.Effect<MatchResult[], StoryError> {
    const storyRepo = this.storyRepo

    return storyRepo.findMany({ page: 1, limit: 100, sort: "latest" }).pipe(
      Effect.map(result => {
        const matches: MatchResult[] = []

        for (const story of result.data) {
          const titleSim = titleSimilarity(evidence, story.title)
          if (titleSim < MIN_TITLE_SIMILARITY) continue

          const contentSim = contentSimilarity(evidence, story.summary ?? null)
          if (
            titleSim + contentSim <
            MIN_TITLE_SIMILARITY + MIN_CONTENT_SIMILARITY
          )
            continue

          const confidence = Math.min(titleSim * 0.7 + contentSim * 0.3, 1.0)

          matches.push({
            storyId: story.id,
            title: story.title,
            confidence: Math.round(confidence * 100) / 100,
          })
        }

        return matches.sort((a, b) => b.confidence - a.confidence)
      }),
      Effect.catchAll(cause =>
        Effect.fail(
          new MatchError({ message: "Failed to fetch stories", cause })
        )
      )
    )
  }
}
