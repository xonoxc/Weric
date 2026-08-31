import { describe, expect, it } from "vitest"
import { Effect } from "effect"
import { persistConceptGraph } from "../graph.ts"

import type {
  GraphPersistence,
  GraphConceptRow,
  GraphEdgeRow,
} from "../graph.ts"
import type { SynthesizedGraph } from "@weric/ai"

class FakeGraphPersistence implements GraphPersistence {
  createConceptCalls: {
    chatId: string
    name: string
    summary?: string | null
  }[] = []
  createEdgeCalls: {
    chatId: string
    sourceConcept: string
    targetConcept: string
    label: string
  }[] = []
  linkStoryCalls: { conceptId: string; storyId: string }[] = []

  createConcept(data: {
    chatId: string
    name: string
    summary?: string | null
  }): Effect.Effect<GraphConceptRow> {
    this.createConceptCalls.push(data)
    return Effect.succeed({
      id: `concept-${data.name}`,
      chatId: data.chatId,
      name: data.name,
      summary: data.summary ?? null,
      positionX: null,
      positionY: null,
    })
  }

  createEdge(data: {
    chatId: string
    sourceConcept: string
    targetConcept: string
    label: string
  }): Effect.Effect<GraphEdgeRow> {
    this.createEdgeCalls.push(data)
    return Effect.succeed({
      id: `edge-${data.sourceConcept}-${data.targetConcept}`,
      ...data,
    })
  }

  linkStory(conceptId: string, storyId: string): Effect.Effect<unknown> {
    this.linkStoryCalls.push({ conceptId, storyId })
    return Effect.succeed(undefined)
  }
}

const sample: SynthesizedGraph = {
  concepts: [
    {
      name: "RAG",
      summary: "Retrieval augmented generation",
      storyIds: ["s1", "s2"],
    },
    {
      name: "Vector DBs",
      summary: "Databases for embeddings",
      storyIds: ["s3"],
    },
  ],
  edges: [
    { source: "RAG", target: "Vector DBs", label: "builds on" },
    { source: "Missing Concept", target: "RAG", label: "ignored" },
  ],
}

describe("persistConceptGraph", () => {
  it("creates concepts, links their stories, persists valid edges, and returns the shaped graph", async () => {
    const repo = new FakeGraphPersistence()
    const graph = await Effect.runPromise(
      persistConceptGraph("chat-1", sample, repo)
    )

    expect(repo.createConceptCalls).toEqual([
      {
        chatId: "chat-1",
        name: "RAG",
        summary: "Retrieval augmented generation",
      },
      {
        chatId: "chat-1",
        name: "Vector DBs",
        summary: "Databases for embeddings",
      },
    ])

    expect(repo.linkStoryCalls).toEqual([
      { conceptId: "concept-RAG", storyId: "s1" },
      { conceptId: "concept-RAG", storyId: "s2" },
      { conceptId: "concept-Vector DBs", storyId: "s3" },
    ])

    expect(repo.createEdgeCalls).toEqual([
      {
        chatId: "chat-1",
        sourceConcept: "concept-RAG",
        targetConcept: "concept-Vector DBs",
        label: "builds on",
      },
    ])

    expect(graph.nodes).toHaveLength(2)
    expect(graph.nodes[0]!.name).toBe("RAG")

    expect(graph.edges).toHaveLength(1)
    expect(graph.edges[0]!.sourceConcept).toBe("concept-RAG")
    expect(graph.edges[0]!.targetConcept).toBe("concept-Vector DBs")

    expect(graph.conceptStories).toHaveLength(3)
    expect(graph.conceptStories[0]).toEqual({
      conceptId: "concept-RAG",
      storyId: "s1",
    })
  })
})
