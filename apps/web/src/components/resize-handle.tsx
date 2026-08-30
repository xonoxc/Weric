import { useCallback, useRef, useState } from "react"

interface ResizeHandleProps {
  onResize: (delta: number) => void
  onResizeEnd?: () => void
  ariaLabel?: string
  direction?: "left" | "right"
}

const HANDLE_WIDTH = 5

export function ResizeHandle({
  onResize,
  onResizeEnd,
  ariaLabel = "Resize pane",
  direction = "right",
}: ResizeHandleProps) {
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      startX.current = e.clientX
      setDragging(true)

      const handleMove = (ev: PointerEvent) => {
        const delta = ev.clientX - startX.current
        // A "right"-facing handle expands the pane to its left when dragged right.
        onResize(direction === "right" ? delta : -delta)
      }

      const handleUp = () => {
        window.removeEventListener("pointermove", handleMove)
        window.removeEventListener("pointerup", handleUp)
        setDragging(false)
        onResizeEnd?.()
      }

      window.addEventListener("pointermove", handleMove)
      window.addEventListener("pointerup", handleUp)
    },
    [direction, onResize, onResizeEnd]
  )

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      className="group relative z-30 shrink-0 select-none"
      style={{
        width: HANDLE_WIDTH,
        cursor: "col-resize",
        touchAction: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: -1,
          right: -1,
          transition: "background 150ms ease",
          background: dragging ? "var(--color-accent)" : "transparent",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: (HANDLE_WIDTH - 1) / 2,
          width: 1,
          background: "var(--color-border)",
          opacity: 0,
          transition: "opacity 150ms ease",
        }}
        className="group-hover:opacity-100"
      />
    </div>
  )
}
