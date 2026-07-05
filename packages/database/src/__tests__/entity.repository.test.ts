import { describe, expect, it, beforeEach } from "vitest"
import { Effect } from "effect"
import { EntityRepository } from "~/repositories/entity.repository.ts"
import { StoryRepository } from "~/repositories/story.repository.ts"
import { getTestDb, cleanDatabase } from "~/__tests__/helpers.ts"
import type { Db } from "~/connection.ts"

describe("EntityRepository", () => {
  let repo: EntityRepository
  let storyRepo: StoryRepository

  beforeEach(async () => {
    await cleanDatabase()
    const db: Db = getTestDb()
    repo = new EntityRepository(db)
    storyRepo = new StoryRepository(db)
  })

  it("creates an entity", async () => {
    const entity = await Effect.runPromise(
      repo.create({ name: "John Doe", type: "person" })
    )
    expect(entity.name).toBe("John Doe")
    expect(entity.type).toBe("person")
    expect(entity.id).toBeDefined()
  })

  it("creates an entity with aliases", async () => {
    const entity = await Effect.runPromise(
      repo.create({
        name: "ACME Corp",
        type: "organization",
        aliases: ["ACME", "Acme Inc"],
      })
    )
    expect(entity.aliases).toEqual(["ACME", "Acme Inc"])
  })

  it("finds entity by name", async () => {
    await Effect.runPromise(repo.create({ name: "Jane Doe", type: "person" }))
    const found = await Effect.runPromise(repo.findByName("Jane Doe"))
    expect(found).not.toBeNull()
    expect(found!.name).toBe("Jane Doe")
  })

  it("returns null when entity not found by name", async () => {
    const result = await Effect.runPromise(repo.findByName("Non Existent"))
    expect(result).toBeNull()
  })

  it("finds entities by type", async () => {
    await Effect.runPromise(repo.create({ name: "Org A", type: "organization" }))
    await Effect.runPromise(repo.create({ name: "Org B", type: "organization" }))
    await Effect.runPromise(repo.create({ name: "Person C", type: "person" }))

    const orgs = await Effect.runPromise(repo.findByType("organization"))
    expect(orgs.length).toBe(2)

    const persons = await Effect.runPromise(repo.findByType("person"))
    expect(persons.length).toBe(1)
  })

  it("links entity to a story", async () => {
    const entity = await Effect.runPromise(
      repo.create({ name: "Linked Entity", type: "person" })
    )
    const story = await Effect.runPromise(
      storyRepo.create({ title: "Linked Story", slug: "linked-story" })
    )

    await Effect.runPromise(repo.linkToStory(story.id, entity.id))
  })
})
