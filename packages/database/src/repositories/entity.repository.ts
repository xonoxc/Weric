import { Effect } from "effect"
import { eq } from "drizzle-orm"
import type { Db } from "../connection.ts"
import { entities, storyEntities } from "../schema/tables.ts"
import { ConnectionError } from "./errors.ts"
import type { RepositoryError } from "./errors.ts"

export class EntityRepository {
  constructor(private readonly db: Db) {}

  create(data: {
    name: string
    type: string
    aliases?: string[]
  }): Effect.Effect<typeof entities.$inferSelect, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await this.db
          .insert(entities)
          .values({
            name: data.name,
            type: data.type,
            aliases: (data.aliases ?? []) as unknown as Record<string, unknown>,
          })
          .returning()
        return rows[0]!
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  findByName(
    name: string
  ): Effect.Effect<typeof entities.$inferSelect | null, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await this.db
          .select()
          .from(entities)
          .where(eq(entities.name, name))
          .limit(1)
        return rows[0] ?? null
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  findByType(
    type: string
  ): Effect.Effect<(typeof entities.$inferSelect)[], RepositoryError> {
    return Effect.tryPromise({
      try: async () => this.db.select().from(entities).where(eq(entities.type, type)),
      catch: cause => new ConnectionError(cause),
    })
  }

  linkToStory(storyId: string, entityId: string): Effect.Effect<void, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        await this.db.insert(storyEntities).values({ storyId, entityId })
      },
      catch: cause => new ConnectionError(cause),
    })
  }
}
