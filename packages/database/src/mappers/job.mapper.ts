import { JobPayloadSchema, JobType } from "packages/contracts/src"
import type { DbJob } from "~db/schema/tables"
import type { Job } from "packages/contracts/src"

export function toJob(row: DbJob): Job {
  return {
    id: row.id,
    type: JobType.parse(row.type),
    payload: JobPayloadSchema.parse(row.payload),
    status: row.status,
    retries: row.retries,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    executedAt: row.executedAt?.toISOString() ?? null,
  }
}
