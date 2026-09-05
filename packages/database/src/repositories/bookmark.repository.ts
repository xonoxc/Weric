import { Effect } from "effect"
import { and, eq, sql } from "drizzle-orm"
import { bookmarks, stories, storyEvidence } from "~db/schema/tables.ts"
import { ConflictError, NotFoundError, tryDb } from "./errors.ts"

import { Database } from "~db/connection.ts"
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

export interface BookmarkRepositoryShape {
  readonly create: (
    userId: string,
    storyId: string
  ) => Effect.Effect<typeof bookmarks.$inferSelect, RepositoryError>

  readonly findByUser: (
    userId: string
  ) => Effect.Effect<(typeof bookmarks.$inferSelect)[], RepositoryError>

  readonly findByUserWithStories: (
    userId: string
  ) => Effect.Effect<BookmarkWithStory[], RepositoryError>

  readonly delete: (
    userId: string,
    storyId: string
  ) => Effect.Effect<void, RepositoryError>

  readonly exists: (
    userId: string,
    storyId: string
  ) => Effect.Effect<boolean, RepositoryError>
}

export class BookmarkRepository extends Effect.Service<BookmarkRepositoryShape>()(
  "BookmarkRepository",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database

      return {
        create: (userId, storyId) =>
          Effect.tryPromise({
            try: async () => {
              const [row] = await db
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
          }),

        findByUser: userId =>
          tryDb(() =>
            db
              .select()
              .from(bookmarks)
              .where(eq(bookmarks.userId, userId))
              .orderBy(bookmarks.createdAt)
          ),

        findByUserWithStories: userId =>
          tryDb(async () => {
            const rows = await db
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
          }),

        delete: (userId, storyId) =>
          tryDb(async () => {
            const [existing] = await db
              .select()
              .from(bookmarks)
              .where(
                and(
                  eq(bookmarks.userId, userId),
                  eq(bookmarks.storyId, storyId)
                )
              )
              .limit(1)
            if (!existing)
              throw new NotFoundError("Bookmark", `${userId}:${storyId}`)

            await db
              .delete(bookmarks)
              .where(
                and(
                  eq(bookmarks.userId, userId),
                  eq(bookmarks.storyId, storyId)
                )
              )
          }),

        exists: (userId, storyId) =>
          tryDb(async () => {
            const [row] = await db
              .select({ id: bookmarks.id })
              .from(bookmarks)
              .where(
                and(
                  eq(bookmarks.userId, userId),
                  eq(bookmarks.storyId, storyId)
                )
              )
              .limit(1)
            return row !== undefined
          }),
      } satisfies BookmarkRepositoryShape
    }),
  }
) {}

export const BookmarkRepositoryLive = BookmarkRepository.Default
