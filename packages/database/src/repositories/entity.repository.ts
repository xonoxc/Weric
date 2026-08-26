import { Effect } from "effect"
import { eq } from "drizzle-orm"
import { entities, storyEntities } from "~db/schema/tables.ts"
import { tryDb } from "./errors.ts"

import type { Db } from "~db/connection.ts"
import type { RepositoryError } from "./errors.ts"

export class EntityRepository {
  constructor(private readonly db: Db) {}

  create(data: {
    name: string
    type: string
    aliases?: string[]
  }): Effect.Effect<typeof entities.$inferSelect, RepositoryError> {
    return tryDb(async () => {
      const [row] = await this.db
        .insert(entities)
        .values({
          name: data.name,
          type: data.type,
          aliases: (data.aliases ?? []) as unknown as Record<string, unknown>,
        })
        .returning()
      return row!
    })
  }

  findByName(
    name: string
  ): Effect.Effect<typeof entities.$inferSelect | null, RepositoryError> {
    return tryDb(async () => {
      const [row] = await this.db
        .select()
        .from(entities)
        .where(eq(entities.name, name))
        .limit(1)
      return row ?? null
    })
  }

  findByType(
    type: string
  ): Effect.Effect<(typeof entities.$inferSelect)[], RepositoryError> {
    return tryDb(() =>
      this.db.select().from(entities).where(eq(entities.type, type))
    )
  }

  linkToStory(
    storyId: string,
    entityId: string
  ): Effect.Effect<void, RepositoryError> {
    return tryDb(() =>
      this.db.insert(storyEntities).values({ storyId, entityId })
    )
  }
}
