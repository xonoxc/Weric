import { Effect } from "effect"
import { EvidenceRepository } from "@weric/database"
import type { JobHandler } from "../runtime.ts"

export function createCleanupEvidenceHandler(
  evidenceRepo: EvidenceRepository
): JobHandler {
  return {
    type: "cleanup_evidence",

    handle(
      _payload: Record<string, unknown>,
      _jobId: string
    ): Effect.Effect<void, Error> {
      return Effect.gen(function* () {
        const { data: allEvidence } = yield* Effect.tryPromise({
          try: () =>
            Effect.runPromise(evidenceRepo.findMany({ page: 1, limit: 1000 })),
          catch: (cause: unknown) =>
            new Error(`Failed to fetch evidence: ${cause}`),
        })

        const cutoff = Date.now() - 90 * 86_400_000
        const stale = allEvidence.filter(
          (e: { discoveredAt: Date }) =>
            new Date(e.discoveredAt).getTime() < cutoff
        )

        console.log(
          `Cleanup: found ${stale.length} stale evidence items out of ${allEvidence.length}`
        )
      })
    },
  }
}
