import { Context, Effect, Layer } from "effect"
import { eq } from "drizzle-orm"
import { conceptStories } from "~db/schema/tables.ts"
import { tryDb } from "./errors.ts"

import { Database } from "~db/connection.ts"
import type { RepositoryError } from "./errors.ts"

export interface ConceptStoryRepository {
  readonly link: (
    conceptId: string,
    storyId: string
  ) => Effect.Effect<void, RepositoryError>

  readonly findStoryIdsByConcept: (
    conceptId: string
  ) => Effect.Effect<string[], RepositoryError>

  readonly findConceptIdsByStory: (
    storyId: string
  ) => Effect.Effect<string[], RepositoryError>
}

export const ConceptStoryRepository =
  Context.GenericTag<ConceptStoryRepository>("ConceptStoryRepository")

export const ConceptStoryRepositoryLive = Layer.effect(
  ConceptStoryRepository,
  Effect.gen(function* () {
    const db = yield* Database

    return {
      link(conceptId, storyId) {
        return tryDb(() =>
          db.insert(conceptStories).values({ conceptId, storyId })
        )
      },

      findStoryIdsByConcept(conceptId) {
        return tryDb(async () => {
          const rows = await db
            .select({ storyId: conceptStories.storyId })
            .from(conceptStories)
            .where(eq(conceptStories.conceptId, conceptId))
          return rows.map(r => r.storyId)
        })
      },

      findConceptIdsByStory(storyId) {
        return tryDb(async () => {
          const rows = await db
            .select({ conceptId: conceptStories.conceptId })
            .from(conceptStories)
            .where(eq(conceptStories.storyId, storyId))
          return rows.map(r => r.conceptId)
        })
      },
    }
  })
)
