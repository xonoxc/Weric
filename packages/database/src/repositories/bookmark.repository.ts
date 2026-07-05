import { Effect } from "effect"
import { and, eq } from "drizzle-orm"
import type { Db } from "../connection.ts"
import { bookmarks } from "../schema/tables.ts"
import { NotFoundError, ConflictError, ConnectionError } from "./errors.ts"
import type { RepositoryError } from "./errors.ts"

export class BookmarkRepository {
  constructor(private readonly db: Db) {}

  create(
    userId: string,
    storyId: string
  ): Effect.Effect<typeof bookmarks.$inferSelect, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await this.db
          .insert(bookmarks)
          .values({ userId, storyId })
          .returning()
        return rows[0]!
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
        return new ConnectionError(cause)
      },
    })
  }

  findByUser(
    userId: string
  ): Effect.Effect<(typeof bookmarks.$inferSelect)[], RepositoryError> {
    return Effect.tryPromise({
      try: async () =>
        this.db
          .select()
          .from(bookmarks)
          .where(eq(bookmarks.userId, userId))
          .orderBy(bookmarks.createdAt),
      catch: cause => new ConnectionError(cause),
    })
  }

  delete(userId: string, storyId: string): Effect.Effect<void, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const existing = await this.db
          .select()
          .from(bookmarks)
          .where(and(eq(bookmarks.userId, userId), eq(bookmarks.storyId, storyId)))
          .limit(1)
        if (!existing[0]) throw new NotFoundError("Bookmark", `${userId}:${storyId}`)

        await this.db
          .delete(bookmarks)
          .where(and(eq(bookmarks.userId, userId), eq(bookmarks.storyId, storyId)))
      },
      catch: cause => {
        if (cause instanceof NotFoundError) return cause
        return new ConnectionError(cause)
      },
    })
  }

  exists(userId: string, storyId: string): Effect.Effect<boolean, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await this.db
          .select({ id: bookmarks.id })
          .from(bookmarks)
          .where(and(eq(bookmarks.userId, userId), eq(bookmarks.storyId, storyId)))
          .limit(1)
        return rows[0] !== undefined
      },
      catch: cause => new ConnectionError(cause),
    })
  }
}
