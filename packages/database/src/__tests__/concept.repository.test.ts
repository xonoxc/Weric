import { describe, expect, it, beforeEach } from "@effect/vitest"
import { Effect, Layer, Option } from "effect"
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

const databaseLayer = Layer.effect(
  Database,
  Effect.sync(() => getTestDb())
)
const conceptRepoLayer = Layer.mergeAll(
  databaseLayer,
  ConceptRepositoryLive.pipe(Layer.provide(databaseLayer)),
  ConceptEdgeRepositoryLive.pipe(Layer.provide(databaseLayer)),
  ConceptStoryRepositoryLive.pipe(Layer.provide(databaseLayer))
)

function insertChat(db: Db): Effect.Effect<string> {
  return Effect.promise(async () => {
    const [chat] = await db
      .insert(chats)
      .values({ title: "Test Chat" })
      .returning()

    return chat!.id
  })
}

function insertStory(db: Db): Effect.Effect<string> {
  return Effect.promise(async () => {
    const [story] = await db
      .insert(stories)
      .values({ title: "Intro to RAG", slug: "intro-to-rag" })
      .returning()

    return story!.id
  })
}

describe("ConceptRepository", () => {
  beforeEach(() => cleanDatabase())

  it.effect("creates a concept scoped to a chat", () =>
    Effect.gen(function* () {
      const db = yield* Database
      const chatId = yield* insertChat(db)

      const concepts = yield* ConceptRepository

      const concept = yield* concepts.create({
        chatId,
        name: "RAG",
        summary: Option.some("Retrieval augmented generation"),
      })
      expect(concept.chatId).toBe(chatId)

      expect(concept.name).toBe("RAG")

      expect(concept.summary).toBe("Retrieval augmented generation")
      expect(concept.id).toBeDefined()
    }).pipe(Effect.provide(conceptRepoLayer))
  )

  it.effect("finds concepts by chat", () =>
    Effect.gen(function* () {
      const db = yield* Database

      const chatId = yield* insertChat(db)

      const concepts = yield* ConceptRepository

      yield* concepts.create({ chatId, name: "A" })
      yield* concepts.create({ chatId, name: "B" })

      const list = yield* concepts.findByChat(chatId)
      expect(list).toHaveLength(2)
    }).pipe(Effect.provide(conceptRepoLayer))
  )

  it.effect("updates a concept position", () =>
    Effect.gen(function* () {
      const db = yield* Database
      const chatId = yield* insertChat(db)

      const concepts = yield* ConceptRepository

      const concept = yield* concepts.create({
        chatId,
        name: "A",
      })
      yield* concepts.updatePosition(concept.id, 120, 240)

      const list = yield* concepts.findByChat(chatId)

      expect(list[0]!.positionX).toBe(120)
      expect(list[0]!.positionY).toBe(240)
    }).pipe(Effect.provide(conceptRepoLayer))
  )
})

describe("ConceptEdgeRepository", () => {
  beforeEach(() => cleanDatabase())

  it.effect("creates a directed flow edge between concepts", () =>
    Effect.gen(function* () {
      const db = yield* Database
      const edges = yield* ConceptEdgeRepository

      const chatId = yield* insertChat(db)

      const concepts = yield* ConceptRepository

      const a = yield* concepts.create({ chatId, name: "A" })
      const b = yield* concepts.create({ chatId, name: "B" })
      const edge = yield* edges.create({
        chatId,
        sourceConcept: a.id,
        targetConcept: b.id,
        label: "builds on",
      })

      expect(edge.sourceConcept).toBe(a.id)
      expect(edge.targetConcept).toBe(b.id)

      expect(edge.label).toBe("builds on")
    }).pipe(Effect.provide(conceptRepoLayer))
  )

  it.effect("finds edges by chat", () =>
    Effect.gen(function* () {
      const db = yield* Database
      const chatId = yield* insertChat(db)

      const concepts = yield* ConceptRepository
      const edges = yield* ConceptEdgeRepository

      const a = yield* concepts.create({ chatId, name: "A" })
      const b = yield* concepts.create({ chatId, name: "B" })
      const c = yield* concepts.create({ chatId, name: "C" })

      yield* edges.create({
        chatId,
        sourceConcept: a.id,
        targetConcept: b.id,
        label: "builds on",
      })
      yield* edges.create({
        chatId,
        sourceConcept: a.id,
        targetConcept: c.id,
        label: "builds on",
      })

      const findAll = yield* edges.findByChat(chatId)
      expect(findAll).toHaveLength(2)
    }).pipe(Effect.provide(conceptRepoLayer))
  )
})

describe("ConceptStoryRepository", () => {
  beforeEach(() => cleanDatabase())

  it.effect("links a story to a concept and finds it back", () =>
    Effect.gen(function* () {
      const db = yield* Database
      const chatId = yield* insertChat(db)
      const storyId = yield* insertStory(db)

      const concepts = yield* ConceptRepository
      const storyLinks = yield* ConceptStoryRepository

      const concept = yield* concepts.create({
        chatId,
        name: "RAG",
      })
      yield* storyLinks.link(concept.id, storyId)

      const storyIds = yield* storyLinks.findStoryIdsByConcept(concept.id)
      expect(storyIds).toContain(storyId)
    }).pipe(Effect.provide(conceptRepoLayer))
  )
})
