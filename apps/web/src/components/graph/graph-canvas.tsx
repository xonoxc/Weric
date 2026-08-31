import { useMemo } from "react"
import { ReactFlow, Background, Controls, MarkerType } from "@xyflow/react"
import { ConceptNode } from "./concept-node.tsx"
import { FlowEdge } from "./flow-edge.tsx"
import { layoutGraph } from "./layout.ts"

import "@xyflow/react/dist/style.css"

import type { ConceptGraph } from "@weric/contracts"
import type { Node, Edge } from "@xyflow/react"

const nodeTypes = {
  concept: ConceptNode,
}

const edgeTypes = {
  flow: FlowEdge,
}

interface GraphCanvasProps {
  graph: ConceptGraph
  onSelectConcept?: (conceptId: string) => void
}

export function GraphCanvas({ graph, onSelectConcept }: GraphCanvasProps) {
  const { nodes, edges } = useMemo(() => {
    const laidOut = layoutGraph(graph)

    const nodes: Node[] = laidOut.map((c, i) => ({
      id: c.id,
      type: "concept",
      position: { x: c.x, y: c.y },
      data: {
        id: c.id,
        name: c.name,
        summary: c.summary,
        storyCount: c.storyCount,
        onSelect: onSelectConcept,
      },
      zIndex: i,
    }))

    const edges: Edge[] = graph.edges.map(e => ({
      id: e.id,
      source: e.sourceConcept,
      target: e.targetConcept,
      type: "flow",
      label: e.label,
      markerEnd: { type: MarkerType.ArrowClosed },
    }))

    return { nodes, edges }
  }, [graph, onSelectConcept])

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        zIndex: "var(--z-canvas)",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  )
}
