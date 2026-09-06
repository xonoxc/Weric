import { Effect } from "effect"
import { JobRepository } from "@weric/database"

import type { Job } from "@weric/contracts"

import type { RepositoryError } from "@weric/database"
import { Optioned } from "@weric/utils"

export interface JobServiceShape {
  readonly findById: (
    id: string
  ) => Effect.Effect<Optioned<Job>, RepositoryError>

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
