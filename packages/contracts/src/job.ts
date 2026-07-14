import { z } from "zod"

export const JobType = z.enum([
  "discover_stories",
  "search_discover",
  "refresh_story",
  "rebuild_recommendations",
  "cleanup_evidence",
  "learn_interests",
  "recompute_scores",
])
export type JobType = z.infer<typeof JobType>

export const JobStatus = z.enum(["pending", "running", "completed", "failed"])
export type JobStatus = z.infer<typeof JobStatus>

export const JobPayloadSchema = z.record(z.string(), z.unknown()).default({})
export type JobPayload = z.infer<typeof JobPayloadSchema>

export const JobSchema = z.object({
  id: z.string().uuid(),
  type: JobType,
  payload: JobPayloadSchema,
  status: JobStatus.default("pending"),
  retries: z.number().int().nonnegative().default(0),
  scheduledAt: z.string().datetime().optional(),
  executedAt: z.string().datetime().optional(),
})
export type Job = z.infer<typeof JobSchema>

export const CreateJobInputSchema = z.object({
  type: JobType,
  payload: JobPayloadSchema.optional(),
  scheduledAt: z.string().datetime().optional(),
})
export type CreateJobInput = z.infer<typeof CreateJobInputSchema>
