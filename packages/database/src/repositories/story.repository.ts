import { Effect } from "effect"
import { and, desc, eq, sql } from "drizzle-orm"
import type { Db } from "../connection.ts"
import {
  stories,
  storyEvidence,
  evidence,
  storyEntities,
  entities,
} from "../schema/tables.ts"
import { NotFoundError, ConnectionError } from "./errors.ts"
import type { RepositoryError } from "./errors.ts"

const TSFMT = 'YYYY-MM-DD"T"HH24:MI:SS"Z"'

export interface StoryQueryOptions {
  page?: number
  limit?: number
  status?: string
  sort?: string
}

export interface StoryWithEvidenceCount {
  id: string
  title: string
  slug: string
  summary: string
  confidence: number
  status: string
  createdAt: string
  updatedAt: string
  evidenceCount: number
}

export interface StoryDetail {
  id: string
  title: string
  slug: string
  summary: string | null
  confidence: number | null
  status: string
  createdAt: string
  updatedAt: string
  evidence: Array<{
    id: string
    source: string
    url: string
    author: string | null
    title: string
    publishedAt: string | null
  }>
  entities: Array<{
    id: string
    name: string
    type: string
  }>
}

export class StoryRepository {
  constructor(private readonly db: Db) {}

  create(data: {
    title: string
    slug: string
    summary?: string
    evidenceIds?: string[]
  }): Effect.Effect<
    {
      id: string
      title: string
      slug: string
      summary: string | null
      createdAt: Date
    },
    RepositoryError
  > {
    return Effect.tryPromise({
      try: async () => {
        const [story] = await this.db
          .insert(stories)
          .values({
            title: data.title,
            slug: data.slug,
            summary: data.summary ?? null,
          })
          .returning()

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

  addEvidence(
    storyId: string,
    evidenceId: string
  ): Effect.Effect<void, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        await this.db.insert(storyEvidence).values({ storyId, evidenceId })
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  findById(
    id: string
  ): Effect.Effect<typeof stories.$inferSelect | null, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const [row] = await this.db
          .select()
          .from(stories)
          .where(eq(stories.id, id))
          .limit(1)
        return row ?? null
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  findBySlug(
    slug: string
  ): Effect.Effect<typeof stories.$inferSelect | null, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const [row] = await this.db
          .select()
          .from(stories)
          .where(eq(stories.slug, slug))
          .limit(1)
        return row ?? null
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
            eq(
              stories.status,
              options.status as "draft" | "published" | "archived"
            )
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

        return {
          data,
          total: Number(countResult[0]?.count ?? 0),
        }
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  findManyWithEvidenceCount(
    options: StoryQueryOptions = {}
  ): Effect.Effect<
    { data: StoryWithEvidenceCount[]; total: number },
    RepositoryError
  > {
    return Effect.tryPromise({
      try: async () => {
        const page = options.page ?? 1
        const limit = Math.min(options.limit ?? 100, 100)
        const offset = (page - 1) * limit

        const conditions: ReturnType<typeof eq>[] = []
        if (options.status) {
          conditions.push(
            eq(
              stories.status,
              options.status as "draft" | "published" | "archived"
            )
          )
        }
        const where = conditions.length > 0 ? and(...conditions) : undefined

        const rows = await this.db
          .select({
            id: stories.id,
            title: stories.title,
            slug: stories.slug,
            summary: sql<string>`COALESCE(${stories.summary}, '')`,
            confidence: sql<number>`COALESCE(${stories.confidence}, 0)`,
            status: stories.status,
            createdAt: sql<string>`to_char(${stories.createdAt}, ${TSFMT})`,
            updatedAt: sql<string>`to_char(${stories.updatedAt}, ${TSFMT})`,
            evidenceCount: sql<number>`
              (SELECT count(*)::int FROM ${storyEvidence} WHERE ${storyEvidence.storyId} = ${stories.id})
            `,
          })
          .from(stories)
          .where(where)
          .orderBy(desc(stories.createdAt))
          .limit(limit)
          .offset(offset)

        const [totalResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(stories)
          .where(where)

        return {
          data: rows as StoryWithEvidenceCount[],
          total: totalResult?.count ?? 0,
        }
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  findBySlugWithDetails(
    slug: string
  ): Effect.Effect<StoryDetail | null, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const [storyRow] = await this.db
          .select({
            id: stories.id,
            title: stories.title,
            slug: stories.slug,
            summary: stories.summary,
            confidence: stories.confidence,
            status: stories.status,
            createdAt: sql<string>`to_char(${stories.createdAt}, ${TSFMT})`,
            updatedAt: sql<string>`to_char(${stories.updatedAt}, ${TSFMT})`,
          })
          .from(stories)
          .where(eq(stories.slug, slug))
          .limit(1)

        if (!storyRow) return null

        const evidenceRows = await this.db
          .select({
            id: evidence.id,
            source: evidence.source,
            url: evidence.url,
            author: evidence.author,
            title: evidence.title,
            publishedAt: sql<
              string | null
            >`to_char(${evidence.publishedAt}, ${TSFMT})`,
          })
          .from(storyEvidence)
          .innerJoin(evidence, eq(storyEvidence.evidenceId, evidence.id))
          .where(eq(storyEvidence.storyId, storyRow.id))

        const entityRows = await this.db
          .select({
            id: entities.id,
            name: entities.name,
            type: entities.type,
          })
          .from(storyEntities)
          .innerJoin(entities, eq(storyEntities.entityId, entities.id))
          .where(eq(storyEntities.storyId, storyRow.id))

        return {
          id: storyRow.id,
          title: storyRow.title,
          slug: storyRow.slug,
          summary: storyRow.summary,
          confidence: storyRow.confidence,
          status: storyRow.status,
          createdAt: storyRow.createdAt,
          updatedAt: storyRow.updatedAt,
          evidence: evidenceRows as StoryDetail["evidence"],
          entities: entityRows as StoryDetail["entities"],
        }
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  searchStories(
    query: string,
    options: { page?: number; limit?: number } = {}
  ): Effect.Effect<
    { data: StoryWithEvidenceCount[]; total: number },
    RepositoryError
  > {
    return Effect.tryPromise({
      try: async () => {
        const page = options.page ?? 1
        const limit = Math.min(options.limit ?? 100, 100)
        const offset = (page - 1) * limit
        const pattern = `%${query}%`

        const condition = sql`(${stories.title} ILIKE ${pattern} OR COALESCE(${stories.summary}, '') ILIKE ${pattern})`

        const rows = await this.db
          .select({
            id: stories.id,
            title: stories.title,
            slug: stories.slug,
            summary: sql<string>`COALESCE(${stories.summary}, '')`,
            confidence: sql<number>`COALESCE(${stories.confidence}, 0)`,
            status: stories.status,
            createdAt: sql<string>`to_char(${stories.createdAt}, ${TSFMT})`,
            updatedAt: sql<string>`to_char(${stories.updatedAt}, ${TSFMT})`,
            evidenceCount: sql<number>`
              (SELECT count(*)::int FROM ${storyEvidence} WHERE ${storyEvidence.storyId} = ${stories.id})
            `,
          })
          .from(stories)
          .where(condition)
          .orderBy(desc(stories.confidence))
          .limit(limit)
          .offset(offset)

        const [totalResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(stories)
          .where(condition)

        return {
          data: rows as StoryWithEvidenceCount[],
          total: totalResult?.count ?? 0,
        }
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  findPublishedFeed(
    options: { page?: number; limit?: number } = {}
  ): Effect.Effect<
    { data: StoryWithEvidenceCount[]; total: number },
    RepositoryError
  > {
    return Effect.tryPromise({
      try: async () => {
        const page = options.page ?? 1
        const limit = Math.min(options.limit ?? 50, 100)
        const offset = (page - 1) * limit

        const rows = await this.db
          .select({
            id: stories.id,
            title: stories.title,
            slug: stories.slug,
            summary: sql<string>`COALESCE(${stories.summary}, '')`,
            confidence: sql<number>`COALESCE(${stories.confidence}, 0)`,
            status: stories.status,
            createdAt: sql<string>`to_char(${stories.createdAt}, ${TSFMT})`,
            updatedAt: sql<string>`to_char(${stories.updatedAt}, ${TSFMT})`,
            evidenceCount: sql<number>`
              (SELECT count(*)::int FROM ${storyEvidence} WHERE ${storyEvidence.storyId} = ${stories.id})
            `,
          })
          .from(stories)
          .where(eq(stories.status, "published"))
          .orderBy(desc(stories.confidence), desc(stories.createdAt))
          .limit(limit)
          .offset(offset)

        const [totalResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(stories)
          .where(eq(stories.status, "published"))

        return {
          data: rows as StoryWithEvidenceCount[],
          total: totalResult?.count ?? 0,
        }
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
        const [existing] = await this.db
          .select()
          .from(stories)
          .where(eq(stories.id, id))
          .limit(1)

        if (!existing) throw new NotFoundError("Story", id)

        const [row] = await this.db
          .update(stories)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(stories.id, id))
          .returning()

        return row!
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
        const [existing] = await this.db
          .select()
          .from(stories)
          .where(eq(stories.id, id))
          .limit(1)
        if (!existing) throw new NotFoundError("Story", id)

        await this.db.delete(stories).where(eq(stories.id, id))
      },
      catch: cause => {
        if (cause instanceof NotFoundError) return cause
        return new ConnectionError(cause)
      },
    })
  }
}
