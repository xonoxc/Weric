import React, { useEffect, useRef } from "react"

interface Node {
  id: string
  label: string
  x: number
  y: number
  color: string
  size: number
}

const nodes: Node[] = [
  {
    id: "center",
    label: "MCP",
    x: 0,
    y: 0,
    color: "var(--color-accent)",
    size: 28,
  },
  {
    id: "anthropic",
    label: "Anthropic",
    x: -80,
    y: -60,
    color: "var(--color-accent-hover)",
    size: 18,
  },
  {
    id: "openai",
    label: "OpenAI",
    x: 80,
    y: -50,
    color: "var(--color-accent-hover)",
    size: 18,
  },
  {
    id: "spec",
    label: "Specification",
    x: -60,
    y: 60,
    color: "var(--color-accent-hover)",
    size: 18,
  },
  {
    id: "github",
    label: "Implementations",
    x: 70,
    y: 55,
    color: "var(--color-accent-hover)",
    size: 18,
  },
  {
    id: "reddit",
    label: "Discussions",
    x: 0,
    y: 90,
    color: "var(--color-accent-hover)",
    size: 18,
  },
]

const edges: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [1, 3],
  [2, 4],
  [3, 4],
  [4, 5],
  [3, 5],
]

export default function GraphVisualization() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const lines = svg.querySelectorAll<SVGLineElement>(".edge")
    const circles = svg.querySelectorAll<SVGCircleElement>(".node-circle")
    const labels = svg.querySelectorAll<SVGTextElement>(".node-label")

    let frame: number
    let t = 0

    const animate = () => {
      t += 0.008
      const phase = Math.sin(t)

      lines.forEach((line, i) => {
        const opacity = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.5 + i * 0.8))
        line.setAttribute("stroke-opacity", String(opacity))
      })

      circles.forEach((circle, i) => {
        const pulse = 1 + 0.08 * Math.sin(t * 2 + i * 1.2)
        const r = nodes[i].size * pulse * 0.5
        circle.setAttribute("r", String(r))
      })

      frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  const cx = 200
  const cy = 140

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 400 280"
      className="w-full h-auto"
      style={{ maxHeight: 300 }}
    >
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {edges.map(([from, to], i) => (
        <line
          key={i}
          className="edge"
          x1={cx + nodes[from].x}
          y1={cy + nodes[from].y}
          x2={cx + nodes[to].x}
          y2={cy + nodes[to].y}
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeOpacity="0.2"
        />
      ))}

      {nodes.map((node, i) => (
        <g
          key={node.id}
          transform={`translate(${cx + node.x}, ${cy + node.y})`}
        >
          <circle r={node.size * 0.8} fill="url(#glow)" opacity={0.6} />
          <circle
            className="node-circle"
            r={node.size * 0.5}
            fill="var(--color-bg)"
            stroke={node.color}
            strokeWidth="2"
          />
          <text
            className="node-label"
            textAnchor="middle"
            dy={node.size * 0.5 + 14}
            fill="var(--color-text-tertiary)"
            fontSize="10"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
