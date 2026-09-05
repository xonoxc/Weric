import { Effect } from "effect"
import { eq } from "drizzle-orm"
import { users } from "~db/schema/tables.ts"
import { tryDb } from "./errors.ts"

import { Database } from "~db/connection.ts"

import { RepositoryError, NotFoundError } from "./errors.ts"

export interface UserRepositoryShape {
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

export class UserRepository extends Effect.Service<UserRepositoryShape>()(
  "UserRepository",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database

      return {
        findAll: () => tryDb(() => db.select().from(users)),

        findById: id => {
          return tryDb(async () => {
            const [row] = await db
              .select()
              .from(users)
              .where(eq(users.id, id))
              .limit(1)
            return row ?? null
          })
        },

        findByEmail: email => {
          return tryDb(async () => {
            const [row] = await db
              .select()
              .from(users)
              .where(eq(users.email, email))
              .limit(1)
            return row ?? null
          })
        },

        findByUsername: username => {
          return tryDb(async () => {
            const [row] = await db
              .select()
              .from(users)
              .where(eq(users.username, username))
              .limit(1)
            return row ?? null
          })
        },

        update: (id, data) => {
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
      } satisfies UserRepositoryShape
    }),
  }
) {}

export const UserRepositoryLive = UserRepository.Default
