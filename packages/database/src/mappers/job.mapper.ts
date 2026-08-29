import { Schema } from "effect"
import { JobPayloadSchema, JobType } from "@weric/contracts"

import type { DbJob } from "~db/schema/tables"
import type { Job, JobStatus } from "packages/contracts/src"

export function toJob(row: DbJob): Job {
  const { payload } = Schema.decodeUnknownSync(
    Schema.Struct({
      payload: JobPayloadSchema,
    })
  )({ payload: row.payload })

  return {
    id: row.id,
    type: Schema.decodeUnknownSync(JobType)(row.type),
    payload: payload,
    status: row.status as JobStatus,
    retries: row.retries,
    scheduledAt: (row.scheduledAt ? row.scheduledAt : null) as Date,
    executedAt: (row.executedAt ? row.executedAt : null) as Date,
  }
}
