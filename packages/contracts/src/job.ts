import { Schema } from "effect"

export const JobType = Schema.Literal(
  "discover_stories",
  "search_discover",
  "refresh_story",
  "rebuild_recommendations",
  "cleanup_evidence",
  "learn_interests",
  "recompute_scores"
)
export type JobType = Schema.Schema.Type<typeof JobType>

export const JobStatus = Schema.Literal(
  "pending",
  "running",
  "completed",
  "failed"
)
export type JobStatus = Schema.Schema.Type<typeof JobStatus>

export const JobPayloadSchema = Schema.optional(
  Schema.Record({
    key: Schema.String,
    value: Schema.Unknown,
  })
).pipe(Schema.withDecodingDefault(() => ({})))

export type JobPayload = Schema.Schema.Type<typeof JobPayloadSchema>

export const JobSchema = Schema.Struct({
  id: Schema.UUID,
  type: JobType,
  payload: JobPayloadSchema,
  status: Schema.optional(JobStatus).pipe(
    Schema.withDecodingDefault(() => "pending" as const)
  ),
  retries: Schema.Number.pipe(Schema.int(), Schema.nonNegative()).pipe(
    Schema.optional,
    Schema.withDecodingDefault(() => 0)
  ),
  scheduledAt: Schema.optional(Schema.NullOr(Schema.Date)).pipe(
    Schema.withDecodingDefault(() => null)
  ),
  executedAt: Schema.optional(Schema.NullOr(Schema.Date)).pipe(
    Schema.withDecodingDefault(() => null)
  ),
})

export type Job = Schema.Schema.Type<typeof JobSchema>

export const CreateJobInputSchema = Schema.Struct({
  type: JobType,
  payload: JobPayloadSchema,
  scheduledAt: Schema.optional(Schema.Date),
})
export type CreateJobInput = Schema.Schema.Type<typeof CreateJobInputSchema>
