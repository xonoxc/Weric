import { Effect } from "effect"
import { eq } from "drizzle-orm"
import { concepts } from "~db/schema/tables.ts"
import { tryDb } from "./errors.ts"

import { Database } from "~db/connection.ts"
import type { RepositoryError } from "./errors.ts"

export interface ConceptRepositoryShape {
  readonly create: (data: {
    chatId: string
    name: string
    summary?: string | null
    positionX?: number | null
    positionY?: number | null
  }) => Effect.Effect<typeof concepts.$inferSelect, RepositoryError>

  readonly findByChat: (
    chatId: string
  ) => Effect.Effect<(typeof concepts.$inferSelect)[], RepositoryError>

  readonly updatePosition: (
    id: string,
    positionX: number,
    positionY: number
  ) => Effect.Effect<void, RepositoryError>
}

export class ConceptRepository extends Effect.Service<ConceptRepositoryShape>()(
  "ConceptRepository",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database

      return {
        create(data) {
          return tryDb(async () => {
            const [row] = await db
              .insert(concepts)
              .values({
                chatId: data.chatId,
                name: data.name,
                summary: data.summary ?? null,
                positionX: data.positionX ?? null,
                positionY: data.positionY ?? null,
              })
              .returning()
            return row!
          })
        },

        findByChat(chatId) {
          return tryDb(() =>
            db.select().from(concepts).where(eq(concepts.chatId, chatId))
          )
        },

        updatePosition(id, positionX, positionY) {
          return tryDb(() =>
            db
              .update(concepts)
              .set({ positionX, positionY })
              .where(eq(concepts.id, id))
          )
        },
      } satisfies ConceptRepositoryShape
    }),
  }
) {}

export const ConceptRepositoryLive = ConceptRepository.Default
