import { Effect } from "effect"
import { and, eq, sql } from "drizzle-orm"
import { bookmarks, stories, storyEvidence } from "~db/schema/tables.ts"
import { ConflictError, NotFoundError, tryDb } from "./errors.ts"

import type { Db } from "~db/connection.ts"
import type { RepositoryError } from "./errors.ts"

const TSFMT = 'YYYY-MM-DD"T"HH24:MI:SS"Z"'

export interface BookmarkWithStory {
  id: string
  storyId: string
  createdAt: string
  story: {
    id: string
    title: string
    slug: string
    summary: string | null
    confidence: number | null
    status: string
    createdAt: string
    updatedAt: string
    evidenceCount: number
  }
}

export class BookmarkRepository {
  constructor(private readonly db: Db) {}

  create(
    userId: string,
    storyId: string
  ): Effect.Effect<typeof bookmarks.$inferSelect, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const [row] = await this.db
          .insert(bookmarks)
          .values({ userId, storyId })
          .returning()
        return row!
      },
      catch: cause => {
        if (
          typeof cause === "object" &&
          cause !== null &&
          "code" in cause &&
          (cause as { code: string }).code === "23505"
        ) {
          return new ConflictError("Bookmark already exists")
        }
        return new ConflictError(String(cause))
      },
    })
  }

  findByUser(
    userId: string
  ): Effect.Effect<(typeof bookmarks.$inferSelect)[], RepositoryError> {
    return tryDb(() =>
      this.db
        .select()
        .from(bookmarks)
        .where(eq(bookmarks.userId, userId))
        .orderBy(bookmarks.createdAt)
    )
  }

  findByUserWithStories(
    userId: string
  ): Effect.Effect<BookmarkWithStory[], RepositoryError> {
    return tryDb(async () => {
      const rows = await this.db
        .select({
          id: bookmarks.id,
          storyId: bookmarks.storyId,
          createdAt: sql<string>`to_char(${bookmarks.createdAt}, ${TSFMT})`,
          story: {
            id: stories.id,
            title: stories.title,
            slug: stories.slug,
            summary: stories.summary,
            confidence: stories.confidence,
            status: stories.status,
            createdAt: sql<string>`to_char(${stories.createdAt}, ${TSFMT})`,
            updatedAt: sql<string>`to_char(${stories.updatedAt}, ${TSFMT})`,
            evidenceCount: sql<number>`
              (SELECT count(*)::int FROM ${storyEvidence} WHERE ${storyEvidence.storyId} = ${stories.id})
            `,
          },
        })
        .from(bookmarks)
        .innerJoin(stories, eq(bookmarks.storyId, stories.id))
        .where(eq(bookmarks.userId, userId))
        .orderBy(bookmarks.createdAt)

      return rows as BookmarkWithStory[]
    })
  }

  delete(
    userId: string,
    storyId: string
  ): Effect.Effect<void, RepositoryError> {
    return tryDb(async () => {
      const [existing] = await this.db
        .select()
        .from(bookmarks)
        .where(
          and(eq(bookmarks.userId, userId), eq(bookmarks.storyId, storyId))
        )
        .limit(1)
      if (!existing) throw new NotFoundError("Bookmark", `${userId}:${storyId}`)

      await this.db
        .delete(bookmarks)
        .where(
          and(eq(bookmarks.userId, userId), eq(bookmarks.storyId, storyId))
        )
    })
  }

  exists(
    userId: string,
    storyId: string
  ): Effect.Effect<boolean, RepositoryError> {
    return tryDb(async () => {
      const [row] = await this.db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(
          and(eq(bookmarks.userId, userId), eq(bookmarks.storyId, storyId))
        )
        .limit(1)
      return row !== undefined
    })
  }
}
