import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type MouseEvent,
  type WheelEvent,
} from "react"

interface CanvasState {
  x: number
  y: number
  scale: number
}

interface CanvasProps {
  children?: ReactNode
  minScale?: number
  maxScale?: number
  initialScale?: number
  className?: string
}

export function Canvas({
  children,
  minScale = 0.1,
  maxScale = 3,
  initialScale = 0.85,
  className,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<CanvasState>({
    x: 0,
    y: 0,
    scale: initialScale,
  })
  const isDragging = useRef(false)
  const isPanning = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const dragStart = useRef({ x: 0, y: 0, stateX: 0, stateY: 0 })

  const [dimensions, setDimensions] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const centerOn = useCallback(
    (x: number, y: number, scale?: number) => {
      setState(prev => ({
        x: dimensions.w / 2 - x * (scale ?? prev.scale),
        y: dimensions.h / 2 - y * (scale ?? prev.scale),
        scale: scale ?? prev.scale,
      }))
    },
    [dimensions]
  )

  const handleWheel = useCallback(
    (e: WheelEvent<HTMLDivElement>) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = -e.deltaY * 0.001
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        setState(prev => {
          const newScale = Math.min(
            maxScale,
            Math.max(minScale, prev.scale * (1 + delta))
          )
          const ratio = newScale / prev.scale
          return {
            x: mx - (mx - prev.x) * ratio,
            y: my - (my - prev.y) * ratio,
            scale: newScale,
          }
        })
      } else {
        setState(prev => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }))
      }
    },
    [minScale, maxScale]
  )

  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.button === 1 || e.button === 0) {
        const isMiddle = e.button === 1
        if (isMiddle) e.preventDefault()
        isDragging.current = true
        isPanning.current = true
        lastPos.current = { x: e.clientX, y: e.clientY }
        dragStart.current = {
          x: e.clientX,
          y: e.clientY,
          stateX: state.x,
          stateY: state.y,
        }
      }
    },
    [state]
  )

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !isPanning.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    setState(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    isPanning.current = false
  }, [])

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false
      isPanning.current = false
    }
    window.addEventListener("mouseup", handleGlobalMouseUp)
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp)
  }, [])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        cursor: isPanning.current ? "grabbing" : "grab",
        background: `
          radial-gradient(circle at 50% 50%, var(--color-bg-secondary) 0%, var(--color-bg) 100%)
        `,
        zIndex: "var(--z-canvas)",
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={e => e.preventDefault()}
    >
      <div
        style={{
          transform: `translate(${state.x}px, ${state.y}px) scale(${state.scale})`,
          transformOrigin: "0 0",
          position: "absolute",
          top: 0,
          left: 0,
          willChange: "transform",
          userSelect: "none",
        }}
      >
        {children}
      </div>
    </div>
  )
}
