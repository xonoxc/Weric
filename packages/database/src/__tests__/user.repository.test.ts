import { describe, expect, it, beforeEach } from "vitest"
import { Effect } from "effect"
import { UserRepository } from "~/repositories/user.repository.ts"
import { getTestDb, cleanDatabase } from "~/__tests__/helpers.ts"
import { users } from "~/schema/tables.ts"
import type { Db } from "~/connection.ts"

const NON_EXISTENT_ID = "00000000-0000-0000-0000-000000000000"

describe("UserRepository", () => {
  let repo: UserRepository
  let db: Db

  beforeEach(async () => {
    await cleanDatabase()
    db = getTestDb()
    repo = new UserRepository(db)
  })

  async function createTestUser(overrides: Partial<typeof users.$inferInsert> = {}) {
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
  }

  it("finds user by id", async () => {
    const created = await createTestUser()
    const found = await Effect.runPromise(repo.findById(created.id))
    expect(found).not.toBeNull()
    expect(found!.id).toBe(created.id)
  })

  it("returns null when user not found by id", async () => {
    const result = await Effect.runPromise(repo.findById(NON_EXISTENT_ID))
    expect(result).toBeNull()
  })

  it("finds user by email", async () => {
    await createTestUser({ email: "byemail@example.com", username: "byemail" })
    const found = await Effect.runPromise(repo.findByEmail("byemail@example.com"))
    expect(found).not.toBeNull()
    expect(found!.email).toBe("byemail@example.com")
  })

  it("updates a user", async () => {
    const created = await createTestUser()
    const updated = await Effect.runPromise(
      repo.update(created.id, { username: "newusername" })
    )
    expect(updated.username).toBe("newusername")
  })

  it("throws NotFoundError when updating non-existent user", async () => {
    const error = await Effect.runPromise(
      repo.update(NON_EXISTENT_ID, { username: "nope" }).pipe(Effect.flip)
    )
    expect(error._tag).toBe("NotFoundError")
  })
})
