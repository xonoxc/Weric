import { Effect } from "effect"

import type { SynthesizedGraph } from "@weric/ai"
import type { ConceptGraph } from "@weric/contracts"

export interface GraphConceptRow {
  id: string
  chatId: string
  name: string
  summary: string | null
  positionX: number | null
  positionY: number | null
}

export interface GraphEdgeRow {
  id: string
  chatId: string
  sourceConcept: string
  targetConcept: string
  label: string
}

export interface GraphPersistence {
  createConcept(data: {
    chatId: string
    name: string
    summary?: string | null
  }): Effect.Effect<GraphConceptRow, unknown>
  createEdge(data: {
    chatId: string
    sourceConcept: string
    targetConcept: string
    label: string
  }): Effect.Effect<GraphEdgeRow, unknown>
  linkStory(conceptId: string, storyId: string): Effect.Effect<unknown, unknown>
}

export function persistConceptGraph(
  chatId: string,
  synthesis: SynthesizedGraph,
  repo: GraphPersistence
): Effect.Effect<ConceptGraph, unknown> {
  return Effect.gen(function* () {
    const byName = new Map<string, string>()

    const nodes: ConceptGraph["nodes"][number][] = []
    const edges: ConceptGraph["edges"][number][] = []
    const conceptStories: ConceptGraph["conceptStories"][number][] = []

    for (const concept of synthesis.concepts) {
      const row = yield* repo.createConcept({
        chatId,
        name: concept.name,
        summary: concept.summary,
      })
      byName.set(concept.name, row.id)
      nodes.push({
        id: row.id,
        chatId: row.chatId,
        name: row.name,
        summary: row.summary,
        positionX: row.positionX,
        positionY: row.positionY,
      })

      for (const storyId of concept.storyIds) {
        yield* repo.linkStory(row.id, storyId)
        conceptStories.push({ conceptId: row.id, storyId })
      }
    }

    for (const edge of synthesis.edges) {
      const source = byName.get(edge.source)
      const target = byName.get(edge.target)
      if (!source || !target) continue
      const row = yield* repo.createEdge({
        chatId,
        sourceConcept: source,
        targetConcept: target,
        label: edge.label,
      })
      edges.push({
        id: row.id,
        chatId: row.chatId,
        sourceConcept: row.sourceConcept,
        targetConcept: row.targetConcept,
        label: row.label,
      })
    }

    return { nodes, edges, conceptStories }
  })
}
