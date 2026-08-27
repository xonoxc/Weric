import { Context, Effect, Layer } from "effect"
import { and, eq, sql } from "drizzle-orm"
import { interests } from "~db/schema/tables.ts"
import { tryDb } from "./errors.ts"

import { Database } from "~db/connection.ts"
import type { RepositoryError } from "./errors.ts"

const TSFMT = 'YYYY-MM-DD"T"HH24:MI:SS"Z"'

export interface InterestRow {
  id: string
  userId: string
  topic: string
  score: number
  updatedAt: string
}

export interface InterestRepository {
  readonly findByUserId: (
    userId: string
  ) => Effect.Effect<InterestRow[], RepositoryError>

  readonly upsert: (
    userId: string,
    topic: string,
    score: number
  ) => Effect.Effect<void, RepositoryError>

  readonly deleteByTopic: (
    userId: string,
    topic: string
  ) => Effect.Effect<void, RepositoryError>
}

export const InterestRepository =
  Context.GenericTag<InterestRepository>("InterestRepository")

export const InterestRepositoryLive = Layer.effect(
  InterestRepository,
  Effect.gen(function* () {
    const db = yield* Database

    return {
      findByUserId: userId => {
        return tryDb(async () => {
          const rows = await db
            .select({
              id: interests.id,
              userId: interests.userId,
              topic: interests.topic,
              score: interests.score,
              updatedAt: sql<string>`to_char(${interests.updatedAt}, ${TSFMT})`,
            })
            .from(interests)
            .where(eq(interests.userId, userId))
            .orderBy(interests.updatedAt)

          return rows as InterestRow[]
        })
      },

      upsert: (userId, topic, score) => {
        return tryDb(() =>
          db
            .insert(interests)
            .values({ userId, topic, score })
            .onConflictDoUpdate({
              target: [interests.userId, interests.topic],
              set: { score, updatedAt: sql`now()` },
            })
        )
      },

      deleteByTopic: (userId, topic) => {
        return tryDb(() =>
          db
            .delete(interests)
            .where(
              and(eq(interests.userId, userId), eq(interests.topic, topic))
            )
        )
      },
    }
  })
)
