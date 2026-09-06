import { Effect, Option } from "effect"
import { and, desc, eq, sql } from "drizzle-orm"
import {
  stories,
  storyEvidence,
  evidence,
  storyEntities,
  entities,
  DBStory,
} from "~db/schema/tables.ts"
import { NotFoundError, tryDb } from "./errors.ts"

import { Database } from "~db/connection.ts"
import type { RepositoryError } from "./errors.ts"
import type { StoryWithEvidenceCount } from "~db/mappers/story.mapper"
import type { Optioned } from "@weric/utils"

export type { StoryWithEvidenceCount } from "~db/mappers/story.mapper"

const TSFMT = 'YYYY-MM-DD"T"HH24:MI:SS"Z"'

export interface StoryQueryOptions {
  page?: number
  limit?: number
  status?: string
  sort?: string
}

export interface StoryDetail {
  id: string
  title: string
  slug: string
  summary: Optioned<string>
  confidence: Optioned<number>
  status: string
  createdAt: string
  updatedAt: string
  evidence: Array<{
    id: string
    source: string
    url: string
    author: Optioned<string>
    title: string
    publishedAt: Optioned<string>
  }>
  entities: Array<{
    id: string
    name: string
    type: string
  }>
}

export interface StoryRepositoryShape {
  readonly create: (data: {
    title: string
    slug: string
    summary: Optioned<string>
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
  ) => Effect.Effect<Optioned<DBStory>, RepositoryError>

  readonly findBySlug: (
    slug: string
  ) => Effect.Effect<Optioned<DBStory>, RepositoryError>

  readonly findMany: (options: Optioned<StoryQueryOptions>) => Effect.Effect<
    {
      data: DBStory[]
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
  ) => Effect.Effect<Optioned<StoryDetail>, RepositoryError>

  readonly searchStories: (
    query: string,
    options: Optioned<{
      page: Optioned<number>
      limit: Optioned<number>
    }>
  ) => Effect.Effect<
    {
      data: StoryWithEvidenceCount[]
      total: number
    },
    RepositoryError
  >

  readonly findPublishedFeed: (
    options: Optioned<{
      page: Optioned<number>
      limit: Optioned<number>
    }>
  ) => Effect.Effect<
    {
      data: StoryWithEvidenceCount[]
      total: number
    },
    RepositoryError
  >

  readonly update: (
    id: string,
    data: {
      title?: Optioned<string>
      slug?: Optioned<string>
      summary?: Optioned<string>
      status?: Optioned<"draft" | "published" | "archived">
      confidence?: Optioned<number>
    }
  ) => Effect.Effect<DBStory, RepositoryError>

  readonly delete: (id: string) => Effect.Effect<void, RepositoryError>
}

export class StoryRepository extends Effect.Service<StoryRepositoryShape>()(
  "StoryRepository",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database

      return {
        create(data) {
          return tryDb(async () => {
            const [story] = await db
              .insert(stories)
              .values({
                title: data.title,
                slug: data.slug,
                summary: Option.getOrNull(data.summary),
              })
              .returning()

            if (!story) throw new Error("Failed to create story")

            if (data.evidenceIds?.length) {
              await db.insert(storyEvidence).values(
                data.evidenceIds.map(evidenceId => ({
                  storyId: story.id,
                  evidenceId,
                }))
              )
            }

            return story
          })
        },

        addEvidence(storyId, evidenceId) {
          return tryDb(() =>
            db
              .insert(storyEvidence)
              .values({ storyId, evidenceId })
              .onConflictDoNothing()
          )
        },

        findById(id) {
          return tryDb(async () => {
            const [row] = await db
              .select()
              .from(stories)
              .where(eq(stories.id, id))
              .limit(1)
            return Option.fromNullable(row)
          })
        },

        findBySlug(slug) {
          return tryDb(async () => {
            const [row] = await db
              .select()
              .from(stories)
              .where(eq(stories.slug, slug))
              .limit(1)

            return Option.fromNullable(row)
          })
        },

        findMany(options) {
          return tryDb(async () => {
            const opts = Option.getOrElse(
              options,
              () => ({}) as StoryQueryOptions
            )
            const page = opts.page ?? 1
            const limit = Math.min(opts.limit ?? 20, 100)
            const offset = (page - 1) * limit

            const conditions = []
            if (opts.status) {
              conditions.push(
                eq(
                  stories.status,
                  opts.status as "draft" | "published" | "archived"
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
                .select({ count: sql<number>`count(*)` })
                .from(stories)
                .where(where),
            ])

            return {
              data,
              total: Number(countResult[0]?.count ?? 0),
            }
          })
        },

        findManyWithEvidenceCount(options = {}) {
          return tryDb(async () => {
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
              .select({ count: sql<number>`count(*)::int` })
              .from(stories)
              .where(where)

            return {
              data: rows as StoryWithEvidenceCount[],
              total: totalResult?.count ?? 0,
            }
          })
        },

        findBySlugWithDetails(slug) {
          return tryDb(async () => {
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

            if (!storyRow) return Option.none()

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

            return Option.some({
              ...storyRow,
              summary: Option.fromNullable(storyRow.summary),
              confidence: Option.fromNullable(storyRow.confidence),
              evidence: evidenceRows.map(evidenceRow => ({
                ...evidenceRow,
                author: Option.fromNullable(evidenceRow.author),
                publishedAt: Option.fromNullable(evidenceRow.publishedAt),
              })),
              entities: entityRows as StoryDetail["entities"],
            })
          })
        },

        searchStories(query, options) {
          return tryDb(async () => {
            const page = Option.getOrElse(
              Option.flatMap(options, opts => opts.page),
              () => 1
            )
            const limit = Option.getOrElse(
              Option.flatMap(options, opts => opts.limit),
              () => 100
            )
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
              .select({ count: sql<number>`count(*)::int` })
              .from(stories)
              .where(condition)

            return {
              data: rows as StoryWithEvidenceCount[],
              total: totalResult?.count ?? 0,
            }
          })
        },

        findPublishedFeed(options) {
          return tryDb(async () => {
            const page = Option.getOrElse(
              Option.flatMap(options, opts => opts.page),
              () => 1
            )
            const limit = Option.getOrElse(
              Option.flatMap(options, opts => opts.limit),
              () => 50
            )
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
              .select({ count: sql<number>`count(*)::int` })
              .from(stories)
              .where(eq(stories.status, "published"))

            return {
              data: rows as StoryWithEvidenceCount[],
              total: totalResult?.count ?? 0,
            }
          })
        },

        update(id, data) {
          return tryDb(async () => {
            const [existing] = await db
              .select()
              .from(stories)
              .where(eq(stories.id, id))
              .limit(1)

            if (!existing) throw new NotFoundError("Story", id)

            const [row] = await db
              .update(stories)
              .set({
                title: Option.getOrUndefined(data.title ?? Option.none()),
                slug: Option.getOrUndefined(data.slug ?? Option.none()),
                summary: Option.getOrUndefined(data.summary ?? Option.none()),
                status: Option.getOrUndefined(data.status ?? Option.none()),
                confidence: Option.getOrUndefined(
                  data.confidence ?? Option.none()
                ),
                updatedAt: new Date(),
              })
              .where(eq(stories.id, id))
              .returning()

            return row!
          })
        },

        delete(id) {
          return tryDb(async () => {
            const [existing] = await db
              .select()
              .from(stories)
              .where(eq(stories.id, id))
              .limit(1)

            if (!existing) throw new NotFoundError("Story", id)

            await db.delete(stories).where(eq(stories.id, id))
          })
        },
      } satisfies StoryRepositoryShape
    }),
  }
) {}

export const StoryRepositoryLive = StoryRepository.Default
