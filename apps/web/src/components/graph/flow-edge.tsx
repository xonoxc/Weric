import { BaseEdge, getSmoothStepPath } from "@xyflow/react"

import type { EdgeProps } from "@xyflow/react"

export function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  selected,
}: EdgeProps) {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
  })

  return (
    <BaseEdge
      id={id}
      path={path}
      label={label}
      style={
        selected
          ? { stroke: "var(--color-accent)", strokeWidth: 2 }
          : {
              stroke: "var(--color-text-tertiary)",
              strokeWidth: 1.5,
            }
      }
    />
  )
}
