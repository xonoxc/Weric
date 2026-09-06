import { describe, expect, it, beforeEach } from "@effect/vitest"
import { Effect, Layer } from "effect"
import { RelationshipRepository } from "~db/repositories/relationship.repository.ts"
import { EntityRepository } from "~db/repositories/entity.repository.ts"
import { getTestDb, cleanDatabase } from "~db/__tests__/helpers.ts"

import { Database } from "~db/connection.ts"

const databaseLayer = Layer.effect(
  Database,
  Effect.sync(() => getTestDb())
)

describe("RelationshipRepository", () => {
  beforeEach(() => cleanDatabase())

  it.effect("creates a relationship between two entities", () =>
    Effect.gen(function* () {
      const db = yield* Database

      const repo = new RelationshipRepository(db)
      const entityRepo = new EntityRepository(db)

      const source = yield* entityRepo.create({
        name: "Alice",
        type: "person",
      })
      const target = yield* entityRepo.create({ name: "Bob", type: "person" })

      const rel = yield* repo.create({
        sourceEntity: source.id,
        targetEntity: target.id,
        relationType: "knows",
      })
      expect(rel.sourceEntity).toBe(source.id)

      expect(rel.targetEntity).toBe(target.id)
      expect(rel.relationType).toBe("knows")
    }).pipe(Effect.provide(databaseLayer))
  )

  it.effect("finds relationships by entity id", () =>
    Effect.gen(function* () {
      const db = yield* Database

      const repo = new RelationshipRepository(db)
      const entityRepo = new EntityRepository(db)

      const alice = yield* entityRepo.create({ name: "Alice", type: "person" })
      const bob = yield* entityRepo.create({ name: "Bob", type: "person" })
      const charlie = yield* entityRepo.create({
        name: "Charlie",
        type: "person",
      })

      yield* repo.create({
        sourceEntity: alice.id,
        targetEntity: bob.id,
        relationType: "knows",
      })
      yield* repo.create({
        sourceEntity: alice.id,
        targetEntity: charlie.id,
        relationType: "knows",
      })

      const results = yield* repo.findByEntity(alice.id)

      expect(results.length).toBe(2)
    }).pipe(Effect.provide(databaseLayer))
  )
})
