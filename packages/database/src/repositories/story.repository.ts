import { Context, Effect, Layer } from "effect"
import { and, desc, eq, sql } from "drizzle-orm"
import {
  stories,
  storyEvidence,
  evidence,
  storyEntities,
  entities,
} from "~db/schema/tables.ts"
import { NotFoundError, ConnectionError } from "./errors.ts"

import type { Db } from "~db/connection.ts"
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

export interface StoryRepository {
  readonly create: (data: {
    title: string
    slug: string
    summary?: string
    evidenceIds?: string[]
  }) => Effect.Effect<
    {
      id: string
      title: string
      slug: string
      summary: string | null
      createdAt: Date
    },
    RepositoryError
  >

  readonly addEvidence: (
    storyId: string,
    evidenceId: string
  ) => Effect.Effect<void, RepositoryError>

  readonly findById: (
    id: string
  ) => Effect.Effect<typeof stories.$inferSelect | null, RepositoryError>

  readonly findBySlug: (
    slug: string
  ) => Effect.Effect<typeof stories.$inferSelect | null, RepositoryError>

  readonly findMany: (options?: StoryQueryOptions) => Effect.Effect<
    {
      data: (typeof stories.$inferSelect)[]
      total: number
    },
    RepositoryError
  >

  readonly findManyWithEvidenceCount: (
    options?: StoryQueryOptions
  ) => Effect.Effect<
    {
      data: StoryWithEvidenceCount[]
      total: number
    },
    RepositoryError
  >

  readonly findBySlugWithDetails: (
    slug: string
  ) => Effect.Effect<StoryDetail | null, RepositoryError>

  readonly searchStories: (
    query: string,
    options?: { page?: number; limit?: number }
  ) => Effect.Effect<
    {
      data: StoryWithEvidenceCount[]
      total: number
    },
    RepositoryError
  >

  readonly findPublishedFeed: (options?: {
    page?: number
    limit?: number
  }) => Effect.Effect<
    {
      data: StoryWithEvidenceCount[]
      total: number
    },
    RepositoryError
  >

  readonly update: (
    id: string,
    data: {
      title?: string
      slug?: string
      summary?: string
      status?: "draft" | "published" | "archived"
      confidence?: number
    }
  ) => Effect.Effect<typeof stories.$inferSelect, RepositoryError>

  readonly delete: (id: string) => Effect.Effect<void, RepositoryError>
}

export const StoryRepository =
  Context.GenericTag<StoryRepository>("StoryRepository")

export const StoryRepositoryLive = (db: Db) =>
  Layer.succeed(StoryRepository, {
    create(data) {
      return Effect.tryPromise({
        try: async () => {
          const [story] = await db
            .insert(stories)
            .values({
              title: data.title,
              slug: data.slug,
              summary: data.summary ?? null,
            })
            .returning()

          if (!story) {
            throw new Error("Failed to create story")
          }

          if (data.evidenceIds?.length) {
            await db.insert(storyEvidence).values(
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
    },

    addEvidence(storyId, evidenceId) {
      return Effect.tryPromise({
        try: () =>
          db
            .insert(storyEvidence)
            .values({ storyId, evidenceId })
            .onConflictDoNothing(),
        catch: cause => new ConnectionError(cause),
      })
    },

    findById(id) {
      return Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select()
            .from(stories)
            .where(eq(stories.id, id))
            .limit(1)

          return row ?? null
        },
        catch: cause => new ConnectionError(cause),
      })
    },

    findBySlug(slug) {
      return Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select()
            .from(stories)
            .where(eq(stories.slug, slug))
            .limit(1)

          return row ?? null
        },
        catch: cause => new ConnectionError(cause),
      })
    },

    findMany(options = {}) {
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
            db
              .select()
              .from(stories)
              .where(where)
              .orderBy(desc(stories.createdAt))
              .limit(limit)
              .offset(offset),

            db
              .select({
                count: sql<number>`count(*)`,
              })
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
    },

    findManyWithEvidenceCount(options = {}) {
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

          const rows = await db
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
                (
                  SELECT count(*)::int
                  FROM ${storyEvidence}
                  WHERE ${storyEvidence.storyId} = ${stories.id}
                )
              `,
            })
            .from(stories)
            .where(where)
            .orderBy(desc(stories.createdAt))
            .limit(limit)
            .offset(offset)

          const [totalResult] = await db
            .select({
              count: sql<number>`count(*)::int`,
            })
            .from(stories)
            .where(where)

          return {
            data: rows as StoryWithEvidenceCount[],
            total: totalResult?.count ?? 0,
          }
        },
        catch: cause => new ConnectionError(cause),
      })
    },

    findBySlugWithDetails(slug) {
      return Effect.tryPromise({
        try: async () => {
          const [storyRow] = await db
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

          const evidenceRows = await db
            .select({
              id: evidence.id,
              source: evidence.source,
              url: evidence.url,
              author: evidence.author,
              title: evidence.title,
              publishedAt: sql<string | null>`
                to_char(${evidence.publishedAt}, ${TSFMT})
              `,
            })
            .from(storyEvidence)
            .innerJoin(evidence, eq(storyEvidence.evidenceId, evidence.id))
            .where(eq(storyEvidence.storyId, storyRow.id))

          const entityRows = await db
            .select({
              id: entities.id,
              name: entities.name,
              type: entities.type,
            })
            .from(storyEntities)
            .innerJoin(entities, eq(storyEntities.entityId, entities.id))
            .where(eq(storyEntities.storyId, storyRow.id))

          return {
            ...storyRow,
            evidence: evidenceRows as StoryDetail["evidence"],
            entities: entityRows as StoryDetail["entities"],
          }
        },
        catch: cause => new ConnectionError(cause),
      })
    },

    searchStories(query, options = {}) {
      return Effect.tryPromise({
        try: async () => {
          const page = options.page ?? 1
          const limit = Math.min(options.limit ?? 100, 100)
          const offset = (page - 1) * limit
          const pattern = `%${query}%`

          const condition = sql`
            (
              ${stories.title} ILIKE ${pattern}
              OR COALESCE(${stories.summary}, '') ILIKE ${pattern}
            )
          `

          const rows = await db
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
                (
                  SELECT count(*)::int
                  FROM ${storyEvidence}
                  WHERE ${storyEvidence.storyId} = ${stories.id}
                )
              `,
            })
            .from(stories)
            .where(condition)
            .orderBy(desc(stories.confidence))
            .limit(limit)
            .offset(offset)

          const [totalResult] = await db
            .select({
              count: sql<number>`count(*)::int`,
            })
            .from(stories)
            .where(condition)

          return {
            data: rows as StoryWithEvidenceCount[],
            total: totalResult?.count ?? 0,
          }
        },
        catch: cause => new ConnectionError(cause),
      })
    },

    findPublishedFeed(options = {}) {
      return Effect.tryPromise({
        try: async () => {
          const page = options.page ?? 1
          const limit = Math.min(options.limit ?? 50, 100)
          const offset = (page - 1) * limit

          const rows = await db
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
                (
                  SELECT count(*)::int
                  FROM ${storyEvidence}
                  WHERE ${storyEvidence.storyId} = ${stories.id}
                )
              `,
            })
            .from(stories)
            .where(eq(stories.status, "published"))
            .orderBy(desc(stories.confidence), desc(stories.createdAt))
            .limit(limit)
            .offset(offset)

          const [totalResult] = await db
            .select({
              count: sql<number>`count(*)::int`,
            })
            .from(stories)
            .where(eq(stories.status, "published"))

          return {
            data: rows as StoryWithEvidenceCount[],
            total: totalResult?.count ?? 0,
          }
        },
        catch: cause => new ConnectionError(cause),
      })
    },

    update(id, data) {
      return Effect.tryPromise({
        try: async () => {
          const [existing] = await db
            .select()
            .from(stories)
            .where(eq(stories.id, id))
            .limit(1)

          if (!existing) {
            throw new NotFoundError("Story", id)
          }

          const [row] = await db
            .update(stories)
            .set({
              ...data,
              updatedAt: new Date(),
            })
            .where(eq(stories.id, id))
            .returning()

          return row!
        },
        catch: cause => {
          return cause instanceof NotFoundError
            ? cause
            : new ConnectionError(cause)
        },
      })
    },

    delete(id) {
      return Effect.tryPromise({
        try: async () => {
          const [existing] = await db
            .select()
            .from(stories)
            .where(eq(stories.id, id))
            .limit(1)

          if (!existing) {
            throw new NotFoundError("Story", id)
          }

          await db.delete(stories).where(eq(stories.id, id))
        },
        catch: cause => {
          return cause instanceof NotFoundError
            ? cause
            : new ConnectionError(cause)
        },
      })
    },
  })
