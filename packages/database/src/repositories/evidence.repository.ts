import { Effect } from "effect"
import { desc, eq, sql } from "drizzle-orm"
import type { Db } from "../connection.ts"
import { evidence } from "../schema/tables.ts"
import { ConflictError, ConnectionError } from "./errors.ts"
import type { RepositoryError } from "./errors.ts"

export class EvidenceRepository {
  constructor(private readonly db: Db) {}

  create(data: {
    source: string
    url: string
    author?: string | null
    title: string
    content: string
    metadata?: Record<string, unknown>
    publishedAt?: Date | null
  }): Effect.Effect<typeof evidence.$inferSelect, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await this.db
          .insert(evidence)
          .values({
            source: data.source,
            url: data.url,
            author: data.author ?? null,
            title: data.title,
            content: data.content,
            metadata: (data.metadata ?? {}) as Record<string, unknown>,
            publishedAt: data.publishedAt ?? null,
          })
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
          return new ConflictError(`Evidence with url '${data.url}' already exists`)
        }
        return new ConnectionError(cause)
      },
    })
  }

  findById(
    id: string
  ): Effect.Effect<typeof evidence.$inferSelect | null, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await this.db
          .select()
          .from(evidence)
          .where(eq(evidence.id, id))
          .limit(1)
        return rows[0] ?? null
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  findByUrl(
    url: string
  ): Effect.Effect<typeof evidence.$inferSelect | null, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await this.db
          .select()
          .from(evidence)
          .where(eq(evidence.url, url))
          .limit(1)
        return rows[0] ?? null
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  findBySource(
    source: string,
    limit = 50
  ): Effect.Effect<(typeof evidence.$inferSelect)[], RepositoryError> {
    return Effect.tryPromise({
      try: async () =>
        this.db
          .select()
          .from(evidence)
          .where(eq(evidence.source, source))
          .orderBy(desc(evidence.discoveredAt))
          .limit(limit),
      catch: cause => new ConnectionError(cause),
    })
  }

  findMany(options: {
    page?: number
    limit?: number
  }): Effect.Effect<
    { data: (typeof evidence.$inferSelect)[]; total: number },
    RepositoryError
  > {
    return Effect.tryPromise({
      try: async () => {
        const page = options.page ?? 1
        const limit = Math.min(options.limit ?? 20, 100)
        const offset = (page - 1) * limit

        const [data, countResult] = await Promise.all([
          this.db
            .select()
            .from(evidence)
            .orderBy(desc(evidence.discoveredAt))
            .limit(limit)
            .offset(offset),
          this.db.select({ count: sql<number>`count(*)` }).from(evidence),
        ])

        return { data, total: Number(countResult[0]?.count ?? 0) }
      },
      catch: cause => new ConnectionError(cause),
    })
  }
}
