import { describe, expect, it, beforeEach } from "@effect/vitest"
import { Effect, Layer, Option } from "effect"
import { EntityRepository } from "~db/repositories/entity.repository.ts"
import {
  StoryRepository,
  StoryRepositoryLive,
} from "~db/repositories/story.repository.ts"
import { getTestDb, cleanDatabase } from "~db/__tests__/helpers.ts"

import { Database } from "~db/connection.ts"

const databaseLayer = Layer.effect(
  Database,
  Effect.sync(() => getTestDb())
)
const storyRepoLayer = Layer.mergeAll(
  databaseLayer,
  StoryRepositoryLive.pipe(Layer.provide(databaseLayer))
)

describe("EntityRepository", () => {
  beforeEach(() => cleanDatabase())

  it.effect("creates an entity", () =>
    Effect.gen(function* () {
      const repo = new EntityRepository(yield* Database)

      const entity = yield* repo.create({
        name: "John Doe",
        type: "person",
      })

      expect(entity.name).toBe("John Doe")
      expect(entity.type).toBe("person")

      expect(entity.id).toBeDefined()
    }).pipe(Effect.provide(databaseLayer))
  )

  it.effect("creates an entity with aliases", () =>
    Effect.gen(function* () {
      const repo = new EntityRepository(yield* Database)

      const entity = yield* repo.create({
        name: "ACME Corp",
        type: "organization",
        aliases: ["ACME", "Acme Inc"],
      })

      expect(entity.aliases).toEqual(["ACME", "Acme Inc"])
    }).pipe(Effect.provide(databaseLayer))
  )

  it.effect("finds entity by name", () =>
    Effect.gen(function* () {
      const repo = new EntityRepository(yield* Database)

      yield* repo.create({
        name: "Jane Doe",
        type: "person",
      })

      const found = yield* repo.findByName("Jane Doe")
      expect(Option.isSome(found)).toBe(true)

      expect(Option.getOrThrow(found).name).toBe("Jane Doe")
    }).pipe(Effect.provide(databaseLayer))
  )

  it.effect("returns none when entity not found by name", () =>
    Effect.gen(function* () {
      const repo = new EntityRepository(yield* Database)

      const result = yield* repo.findByName("Non Existent")
      expect(Option.isNone(result)).toBe(true)
    }).pipe(Effect.provide(databaseLayer))
  )

  it.effect("finds entities by type", () =>
    Effect.gen(function* () {
      const repo = new EntityRepository(yield* Database)

      yield* repo.create({
        name: "Org A",
        type: "organization",
      })
      yield* repo.create({
        name: "Org B",
        type: "organization",
      })
      yield* repo.create({
        name: "Person C",
        type: "person",
      })

      const orgs = yield* repo.findByType("organization")
      expect(orgs.length).toBe(2)

      const persons = yield* repo.findByType("person")
      expect(persons.length).toBe(1)
    }).pipe(Effect.provide(databaseLayer))
  )

  it.effect("links entity to a story", () =>
    Effect.gen(function* () {
      const repo = new EntityRepository(yield* Database)
      const entity = yield* repo.create({
        name: "Linked Entity",
        type: "person",
      })

      const storyRepo = yield* StoryRepository
      const story = yield* storyRepo.create({
        title: "Linked Story",
        slug: "linked-story",
        summary: Option.none(),
      })

      yield* repo.linkToStory(story.id, entity.id)
    }).pipe(Effect.provide(storyRepoLayer))
  )
})
