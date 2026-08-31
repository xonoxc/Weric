import { describe, expect, it, beforeEach } from "vitest"
import { Effect, Layer } from "effect"
import { ConceptRepository } from "~db/repositories/concept.repository.ts"
import { ConceptRepositoryLive } from "~db/repositories/concept.repository.ts"
import { ConceptEdgeRepository } from "~db/repositories/concept-edge.repository.ts"
import { ConceptEdgeRepositoryLive } from "~db/repositories/concept-edge.repository.ts"
import { ConceptStoryRepository } from "~db/repositories/concept-story.repository.ts"
import { ConceptStoryRepositoryLive } from "~db/repositories/concept-story.repository.ts"
import { chats, stories } from "~db/schema/tables.ts"
import { Database } from "~db/connection.ts"
import { getTestDb, cleanDatabase } from "~db/__tests__/helpers.ts"

import type { Db } from "~db/connection.ts"

async function insertChat(db: Db): Promise<string> {
  const [chat] = await db
    .insert(chats)
    .values({ title: "Test Chat" })
    .returning()
  return chat!.id
}

async function insertStory(db: Db): Promise<string> {
  const [story] = await db
    .insert(stories)
    .values({ title: "Intro to RAG", slug: "intro-to-rag" })
    .returning()
  return story!.id
}

function buildServices() {
  return Effect.gen(function* () {
    const concepts = yield* ConceptRepository
    const edges = yield* ConceptEdgeRepository
    const storyLinks = yield* ConceptStoryRepository
    return { concepts, edges, storyLinks }
  })
}

function withDb(db: Db) {
  const DatabaseLayer = Layer.succeed(Database, db)
  const lives = Layer.mergeAll(
    ConceptRepositoryLive,
    ConceptEdgeRepositoryLive,
    ConceptStoryRepositoryLive
  )
  return lives.pipe(Layer.provide(DatabaseLayer)) as Layer.Layer<
    ConceptRepository | ConceptEdgeRepository | ConceptStoryRepository
  >
}

interface Services {
  concepts: ConceptRepository
  edges: ConceptEdgeRepository
  storyLinks: ConceptStoryRepository
}

describe("ConceptRepository", () => {
  let services: Services
  let db: Db

  beforeEach(async () => {
    await cleanDatabase()
    db = getTestDb()
    const full = withDb(db)
    services = (await Effect.runPromise(
      Effect.provide(buildServices(), full)
    )) as Services
  })

  it("creates a concept scoped to a chat", async () => {
    const chatId = await insertChat(db)
    const concept = await Effect.runPromise(
      services.concepts.create({
        chatId,
        name: "RAG",
        summary: "Retrieval augmented generation",
      })
    )
    expect(concept.chatId).toBe(chatId)
    expect(concept.name).toBe("RAG")
    expect(concept.summary).toBe("Retrieval augmented generation")
    expect(concept.id).toBeDefined()
  })

  it("finds concepts by chat", async () => {
    const chatId = await insertChat(db)
    await Effect.runPromise(services.concepts.create({ chatId, name: "A" }))
    await Effect.runPromise(services.concepts.create({ chatId, name: "B" }))
    const list = await Effect.runPromise(services.concepts.findByChat(chatId))
    expect(list).toHaveLength(2)
  })

  it("updates a concept position", async () => {
    const chatId = await insertChat(db)
    const concept = await Effect.runPromise(
      services.concepts.create({ chatId, name: "A" })
    )
    await Effect.runPromise(
      services.concepts.updatePosition(concept.id, 120, 240)
    )
    const list = await Effect.runPromise(services.concepts.findByChat(chatId))
    expect(list[0]!.positionX).toBe(120)
    expect(list[0]!.positionY).toBe(240)
  })
})

describe("ConceptEdgeRepository", () => {
  let services: Services
  let db: Db

  beforeEach(async () => {
    await cleanDatabase()
    db = getTestDb()
    const full = withDb(db)
    services = (await Effect.runPromise(
      Effect.provide(buildServices(), full)
    )) as Services
  })

  it("creates a directed flow edge between concepts", async () => {
    const chatId = await insertChat(db)
    const a = await Effect.runPromise(
      services.concepts.create({ chatId, name: "A" })
    )
    const b = await Effect.runPromise(
      services.concepts.create({ chatId, name: "B" })
    )
    const edge = await Effect.runPromise(
      services.edges.create({
        chatId,
        sourceConcept: a.id,
        targetConcept: b.id,
        label: "builds on",
      })
    )
    expect(edge.sourceConcept).toBe(a.id)
    expect(edge.targetConcept).toBe(b.id)
    expect(edge.label).toBe("builds on")
  })

  it("finds edges by chat", async () => {
    const chatId = await insertChat(db)
    const a = await Effect.runPromise(
      services.concepts.create({ chatId, name: "A" })
    )
    const b = await Effect.runPromise(
      services.concepts.create({ chatId, name: "B" })
    )
    const c = await Effect.runPromise(
      services.concepts.create({ chatId, name: "C" })
    )
    await Effect.runPromise(
      services.edges.create({
        chatId,
        sourceConcept: a.id,
        targetConcept: b.id,
        label: "builds on",
      })
    )
    await Effect.runPromise(
      services.edges.create({
        chatId,
        sourceConcept: a.id,
        targetConcept: c.id,
        label: "builds on",
      })
    )
    const edges = await Effect.runPromise(services.edges.findByChat(chatId))
    expect(edges).toHaveLength(2)
  })
})

describe("ConceptStoryRepository", () => {
  let services: Services
  let db: Db

  beforeEach(async () => {
    await cleanDatabase()
    db = getTestDb()
    const full = withDb(db)
    services = (await Effect.runPromise(
      Effect.provide(buildServices(), full)
    )) as Services
  })

  it("links a story to a concept and finds it back", async () => {
    const chatId = await insertChat(db)
    const storyId = await insertStory(db)
    const concept = await Effect.runPromise(
      services.concepts.create({ chatId, name: "RAG" })
    )
    await Effect.runPromise(services.storyLinks.link(concept.id, storyId))
    const storyIds = await Effect.runPromise(
      services.storyLinks.findStoryIdsByConcept(concept.id)
    )
    expect(storyIds).toContain(storyId)
  })
})
