import { Effect } from "effect"
import { and, desc, eq, sql } from "drizzle-orm"
import type { Db } from "../connection.ts"
import { stories, storyEvidence } from "../schema/tables.ts"
import { NotFoundError, ConflictError, ConnectionError } from "./errors.ts"
import type { RepositoryError } from "./errors.ts"

export interface StoryQueryOptions {
  page?: number
  limit?: number
  status?: string
  sort?: string
}

export class StoryRepository {
  constructor(private readonly db: Db) {}

  create(data: {
    title: string
    slug: string
    summary?: string
    evidenceIds?: string[]
  }): Effect.Effect<
    { id: string; title: string; slug: string; summary: string | null; createdAt: Date },
    RepositoryError
  > {
    return Effect.tryPromise({
      try: async () => {
        const rows = await this.db
          .insert(stories)
          .values({
            title: data.title,
            slug: data.slug,
            summary: data.summary ?? null,
          })
          .returning()

        const story = rows[0]
        if (!story) throw new Error("Failed to create story")

        if (data.evidenceIds && data.evidenceIds.length > 0) {
          await this.db.insert(storyEvidence).values(
            data.evidenceIds.map(evidenceId => ({
              storyId: story.id,
              evidenceId,
            }))
          )
        }

        return story
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  findById(
    id: string
  ): Effect.Effect<typeof stories.$inferSelect | null, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await this.db
          .select()
          .from(stories)
          .where(eq(stories.id, id))
          .limit(1)
        return rows[0] ?? null
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  findBySlug(
    slug: string
  ): Effect.Effect<typeof stories.$inferSelect | null, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await this.db
          .select()
          .from(stories)
          .where(eq(stories.slug, slug))
          .limit(1)
        return rows[0] ?? null
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  findMany(
    options: StoryQueryOptions = {}
  ): Effect.Effect<
    { data: (typeof stories.$inferSelect)[]; total: number },
    RepositoryError
  > {
    return Effect.tryPromise({
      try: async () => {
        const page = options.page ?? 1
        const limit = Math.min(options.limit ?? 20, 100)
        const offset = (page - 1) * limit

        const conditions = []
        if (options.status) {
          conditions.push(
            eq(stories.status, options.status as "draft" | "published" | "archived")
          )
        }

        const where = conditions.length > 0 ? and(...conditions) : undefined

        const [data, countResult] = await Promise.all([
          this.db
            .select()
            .from(stories)
            .where(where)
            .orderBy(desc(stories.createdAt))
            .limit(limit)
            .offset(offset),
          this.db
            .select({ count: sql<number>`count(*)` })
            .from(stories)
            .where(where),
        ])

        return { data, total: Number(countResult[0]?.count ?? 0) }
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  update(
    id: string,
    data: {
      title?: string
      slug?: string
      summary?: string
      status?: "draft" | "published" | "archived"
      confidence?: number
    }
  ): Effect.Effect<typeof stories.$inferSelect, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const existing = await this.db
          .select()
          .from(stories)
          .where(eq(stories.id, id))
          .limit(1)
        if (!existing[0]) throw new NotFoundError("Story", id)

        const rows = await this.db
          .update(stories)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(stories.id, id))
          .returning()
        return rows[0]!
      },
      catch: cause => {
        if (cause instanceof NotFoundError) return cause
        return new ConnectionError(cause)
      },
    })
  }

  delete(id: string): Effect.Effect<void, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const existing = await this.db
          .select()
          .from(stories)
          .where(eq(stories.id, id))
          .limit(1)
        if (!existing[0]) throw new NotFoundError("Story", id)

        await this.db.delete(stories).where(eq(stories.id, id))
      },
      catch: cause => {
        if (cause instanceof NotFoundError) return cause
        return new ConnectionError(cause)
      },
    })
  }
}
