import { Effect } from "effect"
import { EvidenceRepository } from "@weric/database"

import type { JobHandler } from "~worker/runtime.ts"

export function createCleanupEvidenceHandler(
  evidenceRepo: EvidenceRepository
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

        yield* Effect.logInfo(
          `Cleanup: found ${stale.length} stale evidence items out of ${allEvidence.length}`
        )
      })
    },
  }
}
