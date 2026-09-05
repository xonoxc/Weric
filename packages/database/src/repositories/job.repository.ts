import { Effect } from "effect"
import { jobs } from "~db/schema/tables.ts"
import { tryDb } from "./errors.ts"

import { Database } from "~db/connection.ts"
import type { RepositoryError } from "./errors.ts"
import type { Job, JobStatus } from "packages/contracts/src/job"
import { sql, eq } from "drizzle-orm"
import { toJob } from "~db/mappers/job.mapper.ts"

export interface JobRepositoryShape {
  readonly create: (data: {
    type: string
    payload?: Record<string, unknown>
    scheduledAt?: Date | null
  }) => Effect.Effect<Job, RepositoryError>

  readonly findPending: () => Effect.Effect<Job[], RepositoryError>

  readonly findById: (id: string) => Effect.Effect<Job | null, RepositoryError>

  readonly updateStatus: (
    id: string,
    status: JobStatus
  ) => Effect.Effect<void, RepositoryError>

  readonly incrementRetries: (
    id: string
  ) => Effect.Effect<void, RepositoryError>

  readonly updatePayload: (
    id: string,
    payload: Record<string, unknown>
  ) => Effect.Effect<void, RepositoryError>
}

export class JobRepository extends Effect.Service<JobRepositoryShape>()(
  "JobRepository",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database

      return {
        create: data => {
          return tryDb(async () => {
            const [row] = await db
              .insert(jobs)
              .values({
                type: data.type,
                payload: (data.payload ?? {}) as Record<string, unknown>,
                scheduledAt: data.scheduledAt ?? null,
              })
              .returning()
            return toJob(row!)
          })
        },
        findPending: () => {
          return tryDb(async () => {
            const rows = await db
              .select()
              .from(jobs)
              .where(
                sql`${jobs.status} = 'pending' AND (${jobs.scheduledAt} IS NULL OR ${jobs.scheduledAt} <= NOW())`
              )
              .orderBy(jobs.scheduledAt)
              .limit(50)!

            return rows.map(toJob)
          })
        },

        findById: id => {
          return tryDb(async () => {
            const [row] = await db
              .select()
              .from(jobs)
              .where(eq(jobs.id, id))
              .limit(1)

            return row ? toJob(row) : null
          })
        },
        updateStatus: (id, status) => {
          return tryDb(
            async () =>
              await db
                .update(jobs)
                .set({
                  status,
                  executedAt: status === "running" ? new Date() : undefined,
                })
                .where(eq(jobs.id, id))
          )
        },
        incrementRetries: id => {
          return tryDb(
            async () =>
              await db
                .update(jobs)
                .set({ retries: sql`${jobs.retries} + 1` })
                .where(eq(jobs.id, id))
          )
        },
        updatePayload: (id, payload) => {
          return tryDb(
            async () =>
              await db
                .update(jobs)
                .set({
                  payload: sql`${jobs.payload}::jsonb || ${JSON.stringify(payload)}::jsonb`,
                })
                .where(eq(jobs.id, id))
          )
        },
      } satisfies JobRepositoryShape
    }),
  }
) {}

export const JobRepositoryLive = JobRepository.Default
