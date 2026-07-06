import { useState, useEffect, useCallback } from "react"
import { Canvas, StoryCard, CommandBar, TopBar } from "@weric/ui"
import type { StoryCardData } from "@weric/ui"
import { fetchFeed, searchStories } from "../lib/api-client.ts"

interface PositionedStory extends StoryCardData {
  x: number
  y: number
}

function layoutStories(stories: StoryCardData[]): PositionedStory[] {
  const spacing = 320
  const cols = Math.ceil(Math.sqrt(stories.length))
  return stories.map((story, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const offsetX =
      (col - (cols - 1) / 2) * spacing + (row % 2 === 0 ? 0 : spacing * 0.5)
    const offsetY = (row - (stories.length / cols - 1) / 2) * spacing
    return { ...story, x: offsetX, y: offsetY }
  })
}

const loadingContainer: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--space-lg)",
  background: "var(--color-bg)",
  zIndex: "var(--z-canvas)",
}

const emptyContainer: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--space-md)",
  zIndex: "var(--z-canvas-overlay)",
  pointerEvents: "none",
}

const emptyTitle: React.CSSProperties = {
  fontSize: "var(--font-size-xl)",
  fontWeight: "var(--font-weight-semibold)",
  color: "var(--color-text-primary)",
  letterSpacing: "var(--letter-spacing-tight)",
}

const emptySubtitle: React.CSSProperties = {
  fontSize: "var(--font-size-base)",
  color: "var(--color-text-secondary)",
  maxWidth: 400,
  textAlign: "center",
  lineHeight: "var(--line-height-relaxed)",
}

const loadingDots: React.CSSProperties = {
  display: "flex",
  gap: "var(--space-sm)",
}

const dot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "var(--color-accent)",
  animation: "pulse 1.4s infinite ease-in-out",
}

export default function Home() {
  const [stories, setStories] = useState<PositionedStory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const loadFeed = useCallback(async () => {
    setLoading(true)
    setError(null)
    setHasSearched(false)
    try {
      const items = await fetchFeed()
      setStories(layoutStories(items))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed")
      setStories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const handleSearch = useCallback(async (query: string) => {
    setLoading(true)
    setError(null)
    setHasSearched(true)
    try {
      const items = await searchStories(query)
      setStories(layoutStories(items))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed")
      setStories([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleExpand = useCallback((id: string) => {
    console.log(`Expand story ${id}`)
  }, [])

  const handleBookmark = useCallback((id: string) => {
    console.log(`Bookmark toggle ${id}`)
  }, [])

  if (loading && stories.length === 0) {
    return (
      <div style={loadingContainer}>
        <div
          style={{
            fontSize: "var(--font-size-lg)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-text-primary)",
            letterSpacing: "var(--letter-spacing-tight)",
          }}
        >
          Weric
        </div>
        <div style={loadingDots}>
          <div style={{ ...dot, animationDelay: "0s" }} />
          <div style={{ ...dot, animationDelay: "0.2s" }} />
          <div style={{ ...dot, animationDelay: "0.4s" }} />
        </div>
        <div
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-tertiary)",
          }}
        >
          Loading your knowledge space...
        </div>
      </div>
    )
  }

  return (
    <>
      <TopBar />
      <Canvas initialScale={0.85}>
        {stories.map(s => (
          <StoryCard
            key={s.id}
            story={s}
            style={{ left: s.x, top: s.y }}
            onExpand={handleExpand}
            onBookmark={handleBookmark}
          />
        ))}
      </Canvas>
      {!loading && stories.length === 0 && !error && (
        <div style={emptyContainer}>
          <div style={emptyTitle}>Your knowledge space is empty</div>
          <div style={emptySubtitle}>
            {hasSearched
              ? "No results found. Try a different search."
              : "Ask a question or explore trending topics to get started."}
          </div>
        </div>
      )}
      {error && (
        <div style={emptyContainer}>
          <div style={{ ...emptyTitle, color: "var(--color-danger)" }}>
            Connection issue
          </div>
          <div style={emptySubtitle}>{error}</div>
        </div>
      )}
      <CommandBar onSearch={handleSearch} />
    </>
  )
}
