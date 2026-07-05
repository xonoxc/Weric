import { Effect } from "effect"
import { eq } from "drizzle-orm"
import type { Db } from "../connection.ts"
import { users } from "../schema/tables.ts"
import { NotFoundError, ConflictError, ConnectionError } from "./errors.ts"
import type { RepositoryError } from "./errors.ts"

export class UserRepository {
  constructor(private readonly db: Db) {}

  create(data: {
    email: string
    username: string
  }): Effect.Effect<typeof users.$inferSelect, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const [row] = await this.db.insert(users).values(data).returning()
        return row!
      },
      catch: cause => {
        if (
          typeof cause === "object" &&
          cause !== null &&
          "code" in cause &&
          (cause as { code: string }).code === "23505"
        ) {
          return new ConflictError("User with this email or username already exists")
        }
        return new ConnectionError(cause)
      },
    })
  }

  findById(id: string): Effect.Effect<typeof users.$inferSelect | null, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const [userRow] = await this.db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1)
        return userRow ?? null
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  findByEmail(
    email: string
  ): Effect.Effect<typeof users.$inferSelect | null, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const rows = await this.db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)
        return rows[0] ?? null
      },
      catch: cause => new ConnectionError(cause),
    })
  }

  update(
    id: string,
    data: { username?: string; email?: string }
  ): Effect.Effect<typeof users.$inferSelect, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const [existing] = await this.db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1)

        if (!existing) throw new NotFoundError("User", id)

        const [row] = await this.db
          .update(users)
          .set(data)
          .where(eq(users.id, id))
          .returning()
        return row!
      },
      catch: cause => {
        if (cause instanceof NotFoundError) return cause
        return new ConnectionError(cause)
      },
    })
  }
}
