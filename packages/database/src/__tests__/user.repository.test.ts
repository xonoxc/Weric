import { describe, expect, it, beforeEach } from "@effect/vitest"
import { Effect, Layer, Option } from "effect"
import {
  UserRepository,
  UserRepositoryLive,
} from "~db/repositories/user.repository.ts"
import { getTestDb, cleanDatabase } from "~db/__tests__/helpers.ts"
import { users } from "~db/schema/tables.ts"

import { Database } from "~db/connection.ts"
import type { Db } from "~db/connection.ts"

const NON_EXISTENT_ID = "00000000-0000-0000-0000-000000000000"

const databaseLayer = Layer.effect(
  Database,
  Effect.sync(() => getTestDb())
)
const userRepoLayer = Layer.mergeAll(
  databaseLayer,
  UserRepositoryLive.pipe(Layer.provide(databaseLayer))
)

function insertTestUser(
  db: Db,
  overrides: Partial<typeof users.$inferInsert> = {}
): Effect.Effect<typeof users.$inferSelect> {
  return Effect.promise(async () => {
    const [row] = await db
      .insert(users)
      .values({
        name: overrides.name ?? "Test User",
        email: overrides.email ?? "test@example.com",
        emailVerified: overrides.emailVerified ?? false,
        username: overrides.username ?? "testuser",
        ...overrides,
      })
      .returning()

    return row!
  })
}

describe("UserRepository", () => {
  beforeEach(() => cleanDatabase())

  it.effect("finds user by id", () =>
    Effect.gen(function* () {
      const repo = yield* UserRepository
      const db = yield* Database

      const created = yield* insertTestUser(db)

      const found = yield* repo.findById(created.id)
      expect(Option.isSome(found)).toBe(true)

      expect(Option.getOrThrow(found).id).toBe(created.id)
    }).pipe(Effect.provide(userRepoLayer))
  )

  it.effect("returns none when user not found by id", () =>
    Effect.gen(function* () {
      const repo = yield* UserRepository

      const result = yield* repo.findById(NON_EXISTENT_ID)

      expect(Option.isNone(result)).toBe(true)
    }).pipe(Effect.provide(userRepoLayer))
  )

  it.effect("finds user by email", () =>
    Effect.gen(function* () {
      const repo = yield* UserRepository
      const db = yield* Database

      yield* insertTestUser(db, {
        email: "byemail@example.com",
        username: "byemail",
      })

      const found = yield* repo.findByEmail("byemail@example.com")
      expect(Option.isSome(found)).toBe(true)

      expect(Option.getOrThrow(found).email).toBe("byemail@example.com")
    }).pipe(Effect.provide(userRepoLayer))
  )

  it.effect("updates a user", () =>
    Effect.gen(function* () {
      const repo = yield* UserRepository
      const db = yield* Database

      const created = yield* insertTestUser(db)

      const updated = yield* repo.update(created.id, {
        username: "newusername",
      })

      expect(updated.username).toBe("newusername")
    }).pipe(Effect.provide(userRepoLayer))
  )

  it.effect("throws NotFoundError when updating non-existent user", () =>
    Effect.gen(function* () {
      const repo = yield* UserRepository

      const error = yield* repo
        .update(NON_EXISTENT_ID, { username: "nope" })
        .pipe(Effect.flip)

      expect(error._tag).toBe("NotFoundError")
    }).pipe(Effect.provide(userRepoLayer))
  )
})
