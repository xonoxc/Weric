import { Context, Effect, Layer } from "effect"
import { JobRepository } from "@weric/database"
import { Job } from "@weric/contracts"

import type { RepositoryError } from "@weric/database"

export interface JobServiceShape {
  readonly findById: (id: string) => Effect.Effect<Job | null, RepositoryError>

  readonly findPending: () => Effect.Effect<Job[], RepositoryError>
}

export class JobService extends Context.Tag("JobService")<
  JobService,
  JobServiceShape
>() {}

export const JobServiceLive = Layer.effect(
  JobService,
  Effect.gen(function* () {
    const repo = yield* JobRepository

    return {
      findById: id => repo.findById(id),
      findPending: () => repo.findPending(),
    }
  })
)
