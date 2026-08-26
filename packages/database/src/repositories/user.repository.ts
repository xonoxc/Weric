import { Context, Effect, Layer } from "effect"
import { eq } from "drizzle-orm"
import { users } from "~db/schema/tables.ts"
import { NotFoundError, tryDb } from "./errors.ts"

import type { Db } from "~db/connection.ts"
import type { RepositoryError } from "./errors.ts"

export interface UserRepository {
  readonly findAll: () => Effect.Effect<
    (typeof users.$inferSelect)[],
    RepositoryError
  >

  readonly findById: (
    id: string
  ) => Effect.Effect<typeof users.$inferSelect | null, RepositoryError>

  readonly findByEmail: (
    email: string
  ) => Effect.Effect<typeof users.$inferSelect | null, RepositoryError>

  readonly findByUsername: (
    username: string
  ) => Effect.Effect<typeof users.$inferSelect | null, RepositoryError>

  readonly update: (
    id: string,
    data: {
      name?: string
      username?: string
      image?: string
    }
  ) => Effect.Effect<typeof users.$inferSelect, RepositoryError>
}

export const UserRepository =
  Context.GenericTag<UserRepository>("UserRepository")

export const UserRepositoryLive = (db: Db) =>
  Layer.succeed(UserRepository, {
    findAll() {
      return tryDb(() => db.select().from(users))
    },

    findById(id) {
      return tryDb(async () => {
        const [row] = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1)
        return row ?? null
      })
    },

    findByEmail(email) {
      return tryDb(async () => {
        const [row] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)
        return row ?? null
      })
    },

    findByUsername(username) {
      return tryDb(async () => {
        const [row] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1)
        return row ?? null
      })
    },

    update(id, data) {
      return tryDb(async () => {
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1)

        if (!existing) throw new NotFoundError("User", id)

        const [row] = await db
          .update(users)
          .set(data)
          .where(eq(users.id, id))
          .returning()

        return row!
      })
    },
  })
