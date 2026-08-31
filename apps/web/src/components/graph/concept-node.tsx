import { Handle, Position } from "@xyflow/react"

import type { NodeProps } from "@xyflow/react"

export interface ConceptNodeData {
  id: string
  name: string
  summary: string | null
  storyCount: number
  onSelect?: (id: string) => void
}

const nodeStyle: React.CSSProperties = {
  width: 240,
  background: "var(--color-surface)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--color-border)",
  padding: "var(--space-md) var(--space-lg)",
  boxShadow: "var(--shadow-md)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-xs)",
  cursor: "pointer",
}

export function ConceptNode({ data, selected }: NodeProps) {
  const { id, name, summary, storyCount, onSelect } =
    data as unknown as ConceptNodeData

  return (
    <div
      style={{
        ...nodeStyle,
        borderColor: selected ? "var(--color-accent)" : "var(--color-border)",
      }}
      onClick={() => onSelect?.(id)}
    >
      <Handle type="target" position={Position.Top} />
      <div
        style={{
          fontSize: "var(--font-size-base)",
          fontWeight: "var(--font-weight-semibold)",
          color: "var(--color-text-primary)",
          lineHeight: "var(--line-height-tight)",
        }}
      >
        {name}
      </div>
      {summary && (
        <div
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-secondary)",
            lineHeight: "var(--line-height-relaxed)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {summary}
        </div>
      )}
      <div
        style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--color-text-tertiary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>
          {storyCount} story{storyCount === 1 ? "" : "s"}
        </span>
        <span style={{ color: "var(--color-accent)" }}>expand</span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
