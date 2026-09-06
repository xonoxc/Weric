import { Effect, Option } from "effect"
import { desc, eq, sql } from "drizzle-orm"
import { interactions, stories } from "~db/schema/tables.ts"
import { tryDb } from "./errors.ts"

import { Database, type Db } from "~db/connection.ts"
import type { RepositoryError } from "./errors.ts"
import type { Optioned } from "@weric/utils"

export interface InteractionAggregate {
  interactionType: string
  count: number
}

export interface InteractionWithStory {
  id: string
  storyId: string
  interactionType: string
  duration: Optioned<number>
  createdAt: Date
  story: {
    id: string
    title: string
    slug: string
  }
}

export interface InteractionRepositoryShape {
  readonly create: (data: {
    userId: string
    storyId: string
    interactionType: string
    duration: Optioned<number>
  }) => Effect.Effect<typeof interactions.$inferSelect, RepositoryError>

  readonly findByUser: (
    userId: string
  ) => Effect.Effect<(typeof interactions.$inferSelect)[], RepositoryError>

  readonly findByStory: (
    storyId: string
  ) => Effect.Effect<(typeof interactions.$inferSelect)[], RepositoryError>

  readonly aggregateByType: (
    userId: string
  ) => Effect.Effect<InteractionAggregate[], RepositoryError>

  readonly findRecentWithStories: (
    userId: string,
    limit?: number
  ) => Effect.Effect<InteractionWithStory[], RepositoryError>
}

export class InteractionRepository extends Effect.Service<InteractionRepositoryShape>()(
  "InteractionRepository",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database

      return {
        create: data => {
          return tryDb(async () => {
            const [row] = await db
              .insert(interactions)
              .values({
                userId: data.userId,
                storyId: data.storyId,
                interactionType: data.interactionType,
                duration: Option.getOrNull(data.duration),
              })
              .returning()

            return row!
          })
        },

        findByUser: userId => {
          return tryDb(() =>
            db
              .select()
              .from(interactions)
              .where(eq(interactions.userId, userId))
              .orderBy(sql`${interactions.createdAt} DESC`)
          )
        },

        findByStory: storyId => {
          return tryDb(() =>
            db
              .select()
              .from(interactions)
              .where(eq(interactions.storyId, storyId))
          )
        },

        aggregateByType: userId => {
          return tryDb(
            async () =>
              db
                .select({
                  interactionType: interactions.interactionType,
                  count: sql<number>`count(*)::int`,
                })
                .from(interactions)
                .where(eq(interactions.userId, userId))
                .groupBy(
                  interactions.interactionType
                ) as unknown as InteractionAggregate[]
          )
        },

        findRecentWithStories: (userId, limit = 10) => {
          return tryDb(async () => {
            const rows = await db
              .select({
                id: interactions.id,
                storyId: interactions.storyId,
                interactionType: interactions.interactionType,
                duration: interactions.duration,
                createdAt: interactions.createdAt,
                story: {
                  id: stories.id,
                  title: stories.title,
                  slug: stories.slug,
                },
              })
              .from(interactions)
              .innerJoin(stories, eq(interactions.storyId, stories.id))
              .where(eq(interactions.userId, userId))
              .orderBy(desc(interactions.createdAt))
              .limit(Math.min(limit, 50))

            const domainifiedRows = rows.map(row => ({
              ...row,
              duration: Option.fromNullable(row.duration),
            }))

            return domainifiedRows
          })
        },
      } satisfies InteractionRepositoryShape
    }),
  }
) {}

export const InteractionRepositoryLive = InteractionRepository.Default
