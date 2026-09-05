import { Effect } from "effect"
import { eq } from "drizzle-orm"
import { conceptEdges } from "~db/schema/tables.ts"
import { tryDb } from "./errors.ts"

import { Database } from "~db/connection.ts"
import type { RepositoryError } from "./errors.ts"

export interface ConceptEdgeRepositoryShape {
  readonly create: (data: {
    chatId: string
    sourceConcept: string
    targetConcept: string
    label: string
  }) => Effect.Effect<typeof conceptEdges.$inferSelect, RepositoryError>

  readonly findByChat: (
    chatId: string
  ) => Effect.Effect<(typeof conceptEdges.$inferSelect)[], RepositoryError>
}

export class ConceptEdgeRepository extends Effect.Service<ConceptEdgeRepositoryShape>()(
  "ConceptEdgeRepository",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database

      return {
        create(data) {
          return tryDb(async () => {
            const [row] = await db.insert(conceptEdges).values(data).returning()
            return row!
          })
        },

        findByChat(chatId) {
          return tryDb(() =>
            db
              .select()
              .from(conceptEdges)
              .where(eq(conceptEdges.chatId, chatId))
          )
        },
      } satisfies ConceptEdgeRepositoryShape
    }),
  }
) {}

export const ConceptEdgeRepositoryLive = ConceptEdgeRepository.Default
