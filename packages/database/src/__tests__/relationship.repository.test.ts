import { describe, expect, it, beforeEach } from "vitest"
import { Effect } from "effect"
import { RelationshipRepository } from "~/repositories/relationship.repository.ts"
import { EntityRepository } from "~/repositories/entity.repository.ts"
import { getTestDb, cleanDatabase } from "~/__tests__/helpers.ts"
import type { Db } from "~/connection.ts"

describe("RelationshipRepository", () => {
  let repo: RelationshipRepository
  let entityRepo: EntityRepository

  beforeEach(async () => {
    await cleanDatabase()
    const db: Db = getTestDb()
    repo = new RelationshipRepository(db)
    entityRepo = new EntityRepository(db)
  })

  it("creates a relationship between two entities", async () => {
    const source = await Effect.runPromise(
      entityRepo.create({ name: "Alice", type: "person" })
    )
    const target = await Effect.runPromise(
      entityRepo.create({ name: "Bob", type: "person" })
    )

    const rel = await Effect.runPromise(
      repo.create({
        sourceEntity: source.id,
        targetEntity: target.id,
        relationType: "knows",
      })
    )
    expect(rel.sourceEntity).toBe(source.id)
    expect(rel.targetEntity).toBe(target.id)
    expect(rel.relationType).toBe("knows")
  })

  it("finds relationships by entity id", async () => {
    const alice = await Effect.runPromise(
      entityRepo.create({ name: "Alice", type: "person" })
    )
    const bob = await Effect.runPromise(
      entityRepo.create({ name: "Bob", type: "person" })
    )
    const charlie = await Effect.runPromise(
      entityRepo.create({ name: "Charlie", type: "person" })
    )

    await Effect.runPromise(
      repo.create({
        sourceEntity: alice.id,
        targetEntity: bob.id,
        relationType: "knows",
      })
    )
    await Effect.runPromise(
      repo.create({
        sourceEntity: alice.id,
        targetEntity: charlie.id,
        relationType: "knows",
      })
    )

    const results = await Effect.runPromise(repo.findByEntity(alice.id))
    expect(results.length).toBe(2)
  })
})
