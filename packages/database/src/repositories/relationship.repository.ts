import { Effect } from "effect"
import { eq, or } from "drizzle-orm"
import { relationships } from "~db/schema/tables.ts"
import { ConnectionError } from "./errors.ts"

import type { Db } from "~db/connection.ts"
import type { RepositoryError } from "./errors.ts"

export class RelationshipRepository {
  constructor(private readonly db: Db) {}

  create(data: {
    sourceEntity: string
    targetEntity: string
    relationType: string
  }): Effect.Effect<typeof relationships.$inferSelect, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const [row] = await this.db
          .insert(relationships)
          .values(data)
          .returning()
        return row!
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  findByEntity(
    entityId: string
  ): Effect.Effect<(typeof relationships.$inferSelect)[], RepositoryError> {
    return Effect.tryPromise({
      try: async () =>
        this.db
          .select()
          .from(relationships)
          .where(
            or(
              eq(relationships.sourceEntity, entityId),
              eq(relationships.targetEntity, entityId)
            )
          ),
      catch: cause => new ConnectionError(cause),
    })
  }
}
