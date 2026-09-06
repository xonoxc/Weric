import { Effect, Option } from "effect"
import { desc, eq, sql } from "drizzle-orm"
import { DbEvidence, evidence } from "~db/schema/tables.ts"
import { ConflictError, tryDb } from "./errors.ts"

import { Database } from "~db/connection.ts"
import type { RepositoryError } from "./errors.ts"
import type { Optioned } from "@weric/utils"

const TSFMT = 'YYYY-MM-DD"T"HH24:MI:SS"Z"'

export interface EvidenceSearchRow {
  id: string
  source: string
  url: string
  author: Optioned<string>
  title: string
  content: string
  publishedAt: Optioned<string>
  discoveredAt: string
}

export interface EvidenceRepositoryShape {
  readonly create: (data: {
    source: string
    url: string
    author?: Optioned<string>
    title: string
    content: string
    metadata?: Record<string, unknown>
    publishedAt?: Optioned<Date>
  }) => Effect.Effect<DbEvidence, RepositoryError>

  readonly findById: (
    id: string
  ) => Effect.Effect<Optioned<DbEvidence>, RepositoryError>

  readonly findByUrl: (
    url: string
  ) => Effect.Effect<Optioned<DbEvidence>, RepositoryError>

  readonly findBySource: (
    source: string,
    limit?: number
  ) => Effect.Effect<DbEvidence[], RepositoryError>

  readonly findMany: (options: {
    page?: number
    limit?: number
  }) => Effect.Effect<{ data: DbEvidence[]; total: number }, RepositoryError>

  readonly searchEvidence: (
    query: string,
    options?: { page?: number; limit?: number }
  ) => Effect.Effect<
    { data: EvidenceSearchRow[]; total: number },
    RepositoryError
  >
}

export class EvidenceRepository extends Effect.Service<EvidenceRepositoryShape>()(
  "EvidenceRepository",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database

      return {
        create: data => {
          return Effect.tryPromise({
            try: async () => {
              const [row] = await db
                .insert(evidence)
                .values({
                  source: data.source,
                  url: data.url,
                  author: Option.getOrNull(data.author ?? Option.none()),
                  title: data.title,
                  content: data.content,
                  metadata: data.metadata ?? {},
                  publishedAt: Option.getOrNull(
                    data.publishedAt ?? Option.none()
                  ),
                })
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
                return new ConflictError(
                  `Evidence with url '${data.url}' already exists`
                )
              }
              return new ConflictError(String(cause))
            },
          })
        },

        findById: id => {
          return tryDb(async () => {
            const [row] = await db
              .select()
              .from(evidence)
              .where(eq(evidence.id, id))
              .limit(1)
            return Option.fromNullable(row)
          })
        },

        findByUrl: url => {
          return tryDb(async () => {
            const [row] = await db
              .select()
              .from(evidence)
              .where(eq(evidence.url, url))
              .limit(1)
            return Option.fromNullable(row)
          })
        },

        findBySource: (source, limit = 50) => {
          return tryDb(() =>
            db
              .select()
              .from(evidence)
              .where(eq(evidence.source, source))
              .orderBy(desc(evidence.discoveredAt))
              .limit(limit)
          )
        },

        findMany: options => {
          return tryDb(async () => {
            const page = options.page ?? 1
            const limit = Math.min(options.limit ?? 20, 100)
            const offset = (page - 1) * limit

            const [data, countResult] = await Promise.all([
              db
                .select()
                .from(evidence)
                .orderBy(desc(evidence.discoveredAt))
                .limit(limit)
                .offset(offset),
              db.select({ count: sql<number>`count(*)` }).from(evidence),
            ])

            return {
              data,
              total: Number(countResult[0]?.count ?? 0),
            }
          })
        },

        searchEvidence: (query, options = {}) => {
          return tryDb(async () => {
            const page = options.page ?? 1
            const limit = Math.min(options.limit ?? 100, 100)
            const offset = (page - 1) * limit
            const pattern = `%${query}%`

            const condition = sql`(${evidence.title} ILIKE ${pattern} OR ${evidence.content} ILIKE ${pattern})`

            const rows = await db
              .select({
                id: evidence.id,
                source: evidence.source,
                url: evidence.url,
                author: evidence.author,
                title: evidence.title,
                content: evidence.content,
                publishedAt: sql<
                  string | null
                >`to_char(${evidence.publishedAt}, ${TSFMT})`,
                discoveredAt: sql<string>`to_char(${evidence.discoveredAt}, ${TSFMT})`,
              })
              .from(evidence)
              .where(condition)
              .orderBy(desc(evidence.discoveredAt))
              .limit(limit)
              .offset(offset)

            const [totalResult] = await db
              .select({ count: sql<number>`count(*)::int` })
              .from(evidence)
              .where(condition)

            const data = rows.map(row => ({
              ...row,
              author: Option.fromNullable(row.author),
              publishedAt: Option.fromNullable(row.publishedAt),
            }))

            return {
              data,
              total: totalResult?.count ?? 0,
            }
          })
        },
      } satisfies EvidenceRepositoryShape
    }),
  }
) {}

export const EvidenceRepositoryLive = EvidenceRepository.Default
