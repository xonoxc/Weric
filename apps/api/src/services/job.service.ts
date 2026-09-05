import { Effect } from "effect"
import { JobRepository } from "@weric/database"
import { Job } from "@weric/contracts"

import type { RepositoryError } from "@weric/database"

export interface JobServiceShape {
  readonly findById: (id: string) => Effect.Effect<Job | null, RepositoryError>

  readonly findPending: () => Effect.Effect<Job[], RepositoryError>
}

export class JobService extends Effect.Service<JobServiceShape>()(
  "JobService",
  {
    effect: Effect.gen(function* () {
      const repo = yield* JobRepository

      return {
        findById: id => repo.findById(id),
        findPending: () => repo.findPending(),
      } satisfies JobServiceShape
    }),
  }
) {}

export const JobServiceLive = JobService.Default
