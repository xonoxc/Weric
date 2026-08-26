import { Effect } from "effect"
import { eq, sql } from "drizzle-orm"
import { jobs } from "~db/schema/tables.ts"
import { tryDb } from "./errors.ts"

import type { Db } from "~db/connection.ts"
import type { RepositoryError } from "./errors.ts"

export class JobRepository {
  constructor(private readonly db: Db) {}

  create(data: {
    type: string
    payload?: Record<string, unknown>
    scheduledAt?: Date | null
  }): Effect.Effect<typeof jobs.$inferSelect, RepositoryError> {
    return tryDb(async () => {
      const [row] = await this.db
        .insert(jobs)
        .values({
          type: data.type,
          payload: (data.payload ?? {}) as Record<string, unknown>,
          scheduledAt: data.scheduledAt ?? null,
        })
        .returning()
      return row!
    })
  }

  findPending(): Effect.Effect<(typeof jobs.$inferSelect)[], RepositoryError> {
    return tryDb(() =>
      this.db
        .select()
        .from(jobs)
        .where(
          sql`${jobs.status} = 'pending' AND (${jobs.scheduledAt} IS NULL OR ${jobs.scheduledAt} <= NOW())`
        )
        .orderBy(jobs.scheduledAt)
        .limit(50)
    )
  }

  updateStatus(
    id: string,
    status: "pending" | "running" | "completed" | "failed"
  ): Effect.Effect<void, RepositoryError> {
    return tryDb(() =>
      this.db
        .update(jobs)
        .set({
          status,
          executedAt: status === "running" ? new Date() : undefined,
        })
        .where(eq(jobs.id, id))
    )
  }

  incrementRetries(id: string): Effect.Effect<void, RepositoryError> {
    return tryDb(() =>
      this.db
        .update(jobs)
        .set({ retries: sql`${jobs.retries} + 1` })
        .where(eq(jobs.id, id))
    )
  }

  findById(
    id: string
  ): Effect.Effect<typeof jobs.$inferSelect | null, RepositoryError> {
    return tryDb(async () => {
      const [row] = await this.db
        .select()
        .from(jobs)
        .where(eq(jobs.id, id))
        .limit(1)
      return row ?? null
    })
  }

  updatePayload(
    id: string,
    payload: Record<string, unknown>
  ): Effect.Effect<void, RepositoryError> {
    return tryDb(() =>
      this.db
        .update(jobs)
        .set({
          payload: sql`${jobs.payload}::jsonb || ${JSON.stringify(payload)}::jsonb`,
        })
        .where(eq(jobs.id, id))
    )
  }
}
