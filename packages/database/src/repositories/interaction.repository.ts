import { Effect } from "effect"
import { eq, sql } from "drizzle-orm"
import type { Db } from "../connection.ts"
import { interactions } from "../schema/tables.ts"
import { ConnectionError } from "./errors.ts"
import type { RepositoryError } from "./errors.ts"

export interface InteractionAggregate {
  interactionType: string
  count: number
}

export class InteractionRepository {
  constructor(private readonly db: Db) {}

  create(data: {
    userId: string
    storyId: string
    interactionType: string
    duration?: number | null
  }): Effect.Effect<typeof interactions.$inferSelect, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await this.db
          .insert(interactions)
          .values({
            userId: data.userId,
            storyId: data.storyId,
            interactionType: data.interactionType,
            duration: data.duration ?? null,
          })
          .returning()
        return rows[0]!
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  findByUser(
    userId: string
  ): Effect.Effect<(typeof interactions.$inferSelect)[], RepositoryError> {
    return Effect.tryPromise({
      try: async () =>
        this.db
          .select()
          .from(interactions)
          .where(eq(interactions.userId, userId))
          .orderBy(sql`${interactions.createdAt} DESC`),
      catch: cause => new ConnectionError(cause),
    })
  }

  findByStory(
    storyId: string
  ): Effect.Effect<(typeof interactions.$inferSelect)[], RepositoryError> {
    return Effect.tryPromise({
      try: async () =>
        this.db.select().from(interactions).where(eq(interactions.storyId, storyId)),
      catch: cause => new ConnectionError(cause),
    })
  }

  aggregateByType(
    userId: string
  ): Effect.Effect<InteractionAggregate[], RepositoryError> {
    return Effect.tryPromise({
      try: async () =>
        this.db
          .select({
            interactionType: interactions.interactionType,
            count: sql<number>`count(*)::int`,
          })
          .from(interactions)
          .where(eq(interactions.userId, userId))
          .groupBy(interactions.interactionType) as unknown as Promise<
          InteractionAggregate[]
        >,
      catch: cause => new ConnectionError(cause),
    })
  }
}
