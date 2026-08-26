import { Effect } from "effect"
import { eq, or } from "drizzle-orm"
import { relationships } from "~db/schema/tables.ts"
import { tryDb } from "./errors.ts"

import type { Db } from "~db/connection.ts"
import type { RepositoryError } from "./errors.ts"

export class RelationshipRepository {
  constructor(private readonly db: Db) {}

  create(data: {
    sourceEntity: string
    targetEntity: string
    relationType: string
  }): Effect.Effect<typeof relationships.$inferSelect, RepositoryError> {
    return tryDb(async () => {
      const [row] = await this.db.insert(relationships).values(data).returning()
      return row!
    })
  }

  findByEntity(
    entityId: string
  ): Effect.Effect<(typeof relationships.$inferSelect)[], RepositoryError> {
    return tryDb(() =>
      this.db
        .select()
        .from(relationships)
        .where(
          or(
            eq(relationships.sourceEntity, entityId),
            eq(relationships.targetEntity, entityId)
          )
        )
    )
  }
}
