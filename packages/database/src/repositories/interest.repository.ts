import { Effect } from "effect"
import { eq, sql } from "drizzle-orm"
import type { Db } from "../connection.ts"
import { interests } from "../schema/tables.ts"
import { ConnectionError } from "./errors.ts"
import type { RepositoryError } from "./errors.ts"

const TSFMT = 'YYYY-MM-DD"T"HH24:MI:SS"Z"'

export interface InterestRow {
  id: string
  userId: string
  topic: string
  score: number
  updatedAt: string
}

export class InterestRepository {
  constructor(private readonly db: Db) {}

  findByUserId(userId: string): Effect.Effect<InterestRow[], RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await this.db
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
      },
      catch: cause => new ConnectionError(cause),
    })
  }
}
