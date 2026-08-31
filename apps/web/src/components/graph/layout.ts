import dagre from "dagre"

import type { ConceptGraph } from "@weric/contracts"

export interface LaidOutConcept {
  id: string
  name: string
  summary: string | null
  x: number
  y: number
  storyCount: number
}

export function layoutGraph(graph: ConceptGraph): LaidOutConcept[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 90 })

  const storyCountByNode = new Map<string, number>()
  for (const n of graph.nodes) {
    g.setNode(n.id, { width: 240, height: 90 })
  }
  for (const link of graph.conceptStories) {
    storyCountByNode.set(
      link.conceptId,
      (storyCountByNode.get(link.conceptId) ?? 0) + 1
    )
  }
  for (const e of graph.edges) {
    g.setEdge(e.sourceConcept, e.targetConcept)
  }

  dagre.layout(g)

  return graph.nodes.map(n => {
    const pos = g.node(n.id)
    return {
      id: n.id,
      name: n.name,
      summary: n.summary,
      x: (pos?.x ?? 0) - 120,
      y: (pos?.y ?? 0) - 45,
      storyCount: storyCountByNode.get(n.id) ?? 0,
    }
  })
}
