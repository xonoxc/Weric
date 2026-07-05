import { describe, expect, it, beforeEach } from "vitest"
import { Effect } from "effect"
import { UserRepository } from "~/repositories/user.repository.ts"
import { getTestDb, cleanDatabase } from "~/__tests__/helpers.ts"
import type { Db } from "~/connection.ts"

const NON_EXISTENT_ID = "00000000-0000-0000-0000-000000000000"

describe("UserRepository", () => {
  let repo: UserRepository

  beforeEach(async () => {
    await cleanDatabase()
    const db: Db = getTestDb()
    repo = new UserRepository(db)
  })

  it("creates a user", async () => {
    const user = await Effect.runPromise(
      repo.create({
        email: "alice@example.com",
        username: "alice",
      })
    )
    expect(user.email).toBe("alice@example.com")
    expect(user.username).toBe("alice")
    expect(user.id).toBeDefined()
  })

  it("throws ConflictError when email already exists", async () => {
    await Effect.runPromise(
      repo.create({
        email: "dup@example.com",
        username: "first",
      })
    )
    const error = await Effect.runPromise(
      repo
        .create({
          email: "dup@example.com",
          username: "second",
        })
        .pipe(Effect.flip)
    )
    expect(error._tag).toBe("ConflictError")
  })

  it("throws ConflictError when username already exists", async () => {
    await Effect.runPromise(
      repo.create({
        email: "one@example.com",
        username: "shared",
      })
    )
    const error = await Effect.runPromise(
      repo
        .create({
          email: "two@example.com",
          username: "shared",
        })
        .pipe(Effect.flip)
    )
    expect(error._tag).toBe("ConflictError")
  })

  it("finds user by id", async () => {
    const created = await Effect.runPromise(
      repo.create({
        email: "find@example.com",
        username: "finduser",
      })
    )
    const found = await Effect.runPromise(repo.findById(created.id))
    expect(found).not.toBeNull()
    expect(found!.id).toBe(created.id)
  })

  it("returns null when user not found by id", async () => {
    const result = await Effect.runPromise(repo.findById(NON_EXISTENT_ID))
    expect(result).toBeNull()
  })

  it("finds user by email", async () => {
    await Effect.runPromise(
      repo.create({
        email: "byemail@example.com",
        username: "byemail",
      })
    )
    const found = await Effect.runPromise(repo.findByEmail("byemail@example.com"))
    expect(found).not.toBeNull()
    expect(found!.email).toBe("byemail@example.com")
  })

  it("updates a user", async () => {
    const created = await Effect.runPromise(
      repo.create({
        email: "update@example.com",
        username: "updateuser",
      })
    )
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
