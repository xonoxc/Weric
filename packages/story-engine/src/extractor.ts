import { Effect } from "effect"
import type { EntityRepository } from "@weric/database"
import { ExtractionError } from "./errors.ts"
import type { StoryError } from "./errors.ts"
import type { NormalizedDocument } from "./normalizer.ts"

export interface ExtractedEntity {
  name: string
  type: string
}

const COMMON_WORDS = new Set([
  "the",
  "this",
  "that",
  "with",
  "from",
  "what",
  "when",
  "where",
  "which",
  "about",
  "after",
  "before",
  "their",
  "there",
  "would",
  "could",
  "should",
  "have",
  "has",
  "had",
  "not",
  "are",
  "was",
  "were",
  "been",
  "being",
  "more",
  "most",
  "some",
  "any",
  "each",
  "than",
  "then",
  "also",
  "very",
  "just",
  "because",
  "into",
  "over",
])

function extractCandidates(text: string): string[] {
  const candidates: string[] = []
  const sentences = text.split(/[.!?\n]+/)

  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/)
    let currentPhrase: string[] = []

    for (const word of words) {
      const clean = word.replace(/[^a-zA-Z'-]/g, "")
      if (!clean) {
        if (currentPhrase.length > 0) {
          candidates.push(currentPhrase.join(" "))
          currentPhrase = []
        }
        continue
      }

      if (clean[0] === clean[0]?.toUpperCase() && clean[0]?.toLowerCase() !== clean[0]) {
        const lower = clean.toLowerCase()
        if (!COMMON_WORDS.has(lower)) {
          currentPhrase.push(clean)
          continue
        }
      }

      if (currentPhrase.length > 0) {
        candidates.push(currentPhrase.join(" "))
        currentPhrase = []
      }
    }

    if (currentPhrase.length > 0) {
      candidates.push(currentPhrase.join(" "))
    }
  }

  return [...new Set(candidates.filter(c => c.length >= 3))]
}

function classifyEntity(name: string): string {
  const lower = name.toLowerCase()

  if (/^(mr|mrs|ms|dr|prof|president|ceo|cto|cfo|founder|chairman)\.?\s/i.test(name)) {
    return "person"
  }
  if (
    /inc$|llc$|ltd$|corp$|co$|gmbh$|sa$|plc$/i.test(name) ||
    /company|corporation|enterprise|group|partners|associates/i.test(name)
  ) {
    return "organization"
  }
  if (
    /city|town|county|state|province|region|country|river|mountain|island|lake/i.test(
      lower
    )
  ) {
    return "location"
  }
  if (/\d{4}/.test(name)) {
    return "event"
  }
  if (lower.startsWith("the ") && lower.length > 8) {
    return "organization"
  }
  if (!name.includes(" ") && name.length > 1) {
    return "person"
  }

  return "other"
}

export class EntityExtractor {
  constructor(private readonly entityRepo: EntityRepository) {}

  extract(
    evidence: NormalizedDocument,
    storyId: string
  ): Effect.Effect<ExtractedEntity[], StoryError> {
    const entityRepo = this.entityRepo
    const text = `${evidence.title}\n${evidence.content}`
    const candidateNames = extractCandidates(text)

    return Effect.forEach(candidateNames, name =>
      Effect.gen(function* () {
        const type = classifyEntity(name)

        const existing = yield* entityRepo
          .findByName(name)
          .pipe(
            Effect.catchAll(() =>
              Effect.fail(
                new ExtractionError({ message: `Failed to check entity '${name}'` })
              )
            )
          )

        let entityId: string
        if (existing) {
          entityId = existing.id
        } else {
          const created = yield* entityRepo
            .create({ name, type, aliases: [name] })
            .pipe(
              Effect.catchAll(() =>
                Effect.fail(
                  new ExtractionError({ message: `Failed to create entity '${name}'` })
                )
              )
            )
          entityId = created.id
        }

        yield* entityRepo.linkToStory(storyId, entityId).pipe(
          Effect.catchAll(() =>
            Effect.fail(
              new ExtractionError({
                message: `Failed to link entity '${name}' to story`,
              })
            )
          )
        )

        return { name, type } as ExtractedEntity
      })
    )
  }
}
