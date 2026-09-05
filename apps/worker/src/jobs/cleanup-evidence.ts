import { Effect } from "effect"

import type { JobHandler } from "~worker/runtime.ts"
import type { EvidenceRepositoryShape } from "@weric/database"

export function createCleanupEvidenceHandler(
  evidenceRepo: EvidenceRepositoryShape
): JobHandler {
  return {
    type: "cleanup_evidence",

    handle(): Effect.Effect<void, Error> {
      return Effect.gen(function* () {
        const { data: allEvidence } = yield* evidenceRepo
          .findMany({ page: 1, limit: 1000 })
          .pipe(
            Effect.mapError(
              cause => new Error(`Failed to fetch evidence: ${cause}`)
            )
          )

        const stale = allEvidence.filter(
          (e: { discoveredAt: Date }) =>
            new Date(e.discoveredAt).getTime() < Date.now() - 90 * 86_400_000
        )

        yield* Effect.logInfo("Cleanup: found ", {
          stageEvidences: stale.length,
          totalEvidences: allEvidence.length,
        })
      })
    },
  }
}
