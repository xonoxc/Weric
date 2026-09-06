import { describe, expect, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import {
  ConceptRepository,
  ConceptEdgeRepository,
  ConceptStoryRepository,
} from "@weric/database"
import { GraphService, GraphServiceLive } from "~api/services/graph.service"

interface ConceptLike {
  id: string
  chatId: string
  name: string
  summary: string | null
  positionX: number | null
  positionY: number | null
  createdAt: Date
}

interface EdgeLike {
  id: string
  chatId: string
  sourceConcept: string
  targetConcept: string
  label: string
  createdAt: Date
}

const DATA: {
  nodes: ConceptLike[]
  edges: EdgeLike[]
  storyIds: Record<string, string[]>
} = {
  nodes: [
    {
      id: "c1",
      chatId: "chat-1",
      name: "RAG",
      summary: "gen",
      positionX: null,
      positionY: null,
      createdAt: new Date(),
    },
    {
      id: "c2",
      chatId: "chat-1",
      name: "Vector DBs",
      summary: "dbs",
      positionX: 10,
      positionY: 20,
      createdAt: new Date(),
    },
  ],
  edges: [
    {
      id: "e1",
      chatId: "chat-1",
      sourceConcept: "c1",
      targetConcept: "c2",
      label: "builds on",
      createdAt: new Date(),
    },
  ],
  storyIds: { c1: ["s1", "s2"], c2: ["s3"] },
}

function fakeRepos() {
  const conceptRepo = {
    create: () => Effect.succeed(DATA.nodes[0]!),
    findByChat: (chatId: string) =>
      Effect.succeed(DATA.nodes.filter(n => n.chatId === chatId)),
    updatePosition: () => Effect.succeed(undefined),
  }

  const edgeRepo = {
    create: () => Effect.succeed(DATA.edges[0]!),
    findByChat: (chatId: string) =>
      Effect.succeed(DATA.edges.filter(e => e.chatId === chatId)),
  }

  const storyLinkRepo = {
    link: () => Effect.succeed(undefined),
    findStoryIdsByConcept: (conceptId: string) =>
      Effect.succeed(DATA.storyIds[conceptId] ?? []),
    findConceptIdsByStory: () => Effect.succeed([]),
  }

  return { conceptRepo, edgeRepo, storyLinkRepo }
}

const graphServiceLayer = (() => {
  const { conceptRepo, edgeRepo, storyLinkRepo } = fakeRepos()
  return GraphServiceLive.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.succeed(ConceptRepository, conceptRepo),
        Layer.succeed(ConceptEdgeRepository, edgeRepo),
        Layer.succeed(ConceptStoryRepository, storyLinkRepo)
      )
    )
  )
})()

describe("GraphService.getGraph", () => {
  it.effect("assembles nodes, edges, and conceptStories for a chat", () =>
    Effect.gen(function* () {
      const service = yield* GraphService
      const graph = yield* service.getGraph("chat-1")

      expect(graph.nodes.map(n => n.name)).toEqual(["RAG", "Vector DBs"])
      expect(graph.nodes[1]!.positionX).toBe(10)

      expect(graph.edges).toHaveLength(1)
      expect(graph.edges[0]).toMatchObject({
        sourceConcept: "c1",
        targetConcept: "c2",
        label: "builds on",
      })

      expect(graph.conceptStories).toEqual([
        { conceptId: "c1", storyId: "s1" },
        { conceptId: "c1", storyId: "s2" },
        { conceptId: "c2", storyId: "s3" },
      ])
    }).pipe(Effect.provide(graphServiceLayer))
  )
})
