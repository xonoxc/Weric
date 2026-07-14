import { Effect } from "effect"
import { eq, sql } from "drizzle-orm"
import type { Db } from "../connection.ts"
import { jobs } from "../schema/tables.ts"
import { ConnectionError } from "./errors.ts"
import type { RepositoryError } from "./errors.ts"

export class JobRepository {
  constructor(private readonly db: Db) {}

  create(data: {
    type: string
    payload?: Record<string, unknown>
    scheduledAt?: Date | null
  }): Effect.Effect<typeof jobs.$inferSelect, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const [row] = await this.db
          .insert(jobs)
          .values({
            type: data.type,
            payload: (data.payload ?? {}) as Record<string, unknown>,
            scheduledAt: data.scheduledAt ?? null,
          })
          .returning()
        return row!
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  findPending(): Effect.Effect<(typeof jobs.$inferSelect)[], RepositoryError> {
    return Effect.tryPromise({
      try: async () =>
        this.db
          .select()
          .from(jobs)
          .where(
            sql`${jobs.status} = 'pending' AND (${jobs.scheduledAt} IS NULL OR ${jobs.scheduledAt} <= NOW())`
          )
          .orderBy(jobs.scheduledAt)
          .limit(50),
      catch: cause => new ConnectionError(cause),
    })
  }

  updateStatus(
    id: string,
    status: "pending" | "running" | "completed" | "failed"
  ): Effect.Effect<void, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        await this.db
          .update(jobs)
          .set({
            status,
            executedAt: status === "running" ? new Date() : undefined,
          })
          .where(eq(jobs.id, id))
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  incrementRetries(id: string): Effect.Effect<void, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        await this.db
          .update(jobs)
          .set({
            retries: sql`${jobs.retries} + 1`,
          })
          .where(eq(jobs.id, id))
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  findById(
    id: string
  ): Effect.Effect<typeof jobs.$inferSelect | null, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const [row] = await this.db
          .select()
          .from(jobs)
          .where(eq(jobs.id, id))
          .limit(1)
        return row ?? null
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  updatePayload(
    id: string,
    payload: Record<string, unknown>
  ): Effect.Effect<void, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        await this.db
          .update(jobs)
          .set({
            payload: sql`${jobs.payload}::jsonb || ${JSON.stringify(payload)}::jsonb`,
          })
          .where(eq(jobs.id, id))
      },
      catch: cause => new ConnectionError(cause),
    })
  }
}
