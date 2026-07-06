import { useState, useCallback } from "react"

export interface StoryCardData {
  id: string
  title: string
  summary?: string
  confidence: number
  evidenceCount: number
  category?: string
  updatedAt: string
  reason?: string
}

interface StoryCardProps {
  story: StoryCardData
  style?: React.CSSProperties
  onExpand?: (id: string) => void
  onBookmark?: (id: string) => void
}

const cardStyle: React.CSSProperties = {
  width: 280,
  background: "var(--color-surface)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--color-border)",
  padding: "var(--space-lg)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-sm)",
  position: "absolute",
  transition: "all var(--transition-base)",
  cursor: "pointer",
  backdropFilter: "blur(8px)",
  boxShadow: "var(--shadow-md)",
}

const titleStyle: React.CSSProperties = {
  fontSize: "var(--font-size-lg)",
  fontWeight: "var(--font-weight-semibold)",
  lineHeight: "var(--line-height-tight)",
  letterSpacing: "var(--letter-spacing-tight)",
  color: "var(--color-text-primary)",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
}

const summaryStyle: React.CSSProperties = {
  fontSize: "var(--font-size-sm)",
  lineHeight: "var(--line-height-relaxed)",
  color: "var(--color-text-secondary)",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
}

const metaRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: "var(--font-size-xs)",
  color: "var(--color-text-tertiary)",
  marginTop: "var(--space-xs)",
}

const statGroup: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-sm)",
}

const confidenceBadge: React.CSSProperties = {
  padding: "2px 8px",
  borderRadius: "var(--radius-full)",
  fontSize: "var(--font-size-xs)",
  fontWeight: "var(--font-weight-medium)",
  lineHeight: "20px",
}

const actionsRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-xs)",
  marginTop: "var(--space-xs)",
  opacity: 0,
  transition: "opacity var(--transition-fast)",
}

const actionBtn: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: "var(--radius-xs)",
  fontSize: "var(--font-size-xs)",
  color: "var(--color-text-tertiary)",
  transition: "all var(--transition-fast)",
  cursor: "pointer",
  background: "transparent",
  border: "none",
}

const reasonBadge: React.CSSProperties = {
  fontSize: "var(--font-size-xs)",
  color: "var(--color-accent)",
  fontWeight: "var(--font-weight-medium)",
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "var(--color-success)"
  if (confidence >= 0.5) return "var(--color-warning)"
  return "var(--color-text-tertiary)"
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function StoryCard({
  story,
  style,
  onExpand,
  onBookmark,
}: StoryCardProps) {
  const [hovered, setHovered] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  const handleClick = useCallback(() => {
    onExpand?.(story.id)
  }, [story.id, onExpand])

  const handleBookmark = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsBookmarked(prev => !prev)
      onBookmark?.(story.id)
    },
    [story.id, onBookmark]
  )

  return (
    <div
      style={{
        ...cardStyle,
        ...style,
        transform: hovered ? "translateY(-4px)" : "translateY(0px)",
        borderColor: hovered
          ? "var(--color-border-hover)"
          : "var(--color-border)",
        boxShadow: hovered ? "var(--shadow-lg)" : "var(--shadow-md)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      <div style={reasonBadge}>{story.reason ?? "Recommended"}</div>
      <div style={titleStyle}>{story.title}</div>
      {story.summary && <div style={summaryStyle}>{story.summary}</div>}
      <div style={metaRow}>
        <div style={statGroup}>
          <span>
            {story.evidenceCount} source{story.evidenceCount !== 1 ? "s" : ""}
          </span>
          <span>·</span>
          <span>{timeAgo(story.updatedAt)}</span>
        </div>
        <span
          style={{
            ...confidenceBadge,
            background: `${getConfidenceColor(story.confidence)}20`,
            color: getConfidenceColor(story.confidence),
          }}
        >
          {Math.round(story.confidence * 100)}%
        </span>
      </div>
      <div
        style={{
          ...actionsRow,
          opacity: hovered ? 1 : 0,
        }}
      >
        <button
          style={actionBtn}
          onMouseEnter={e => {
            e.currentTarget.style.background = "var(--color-surface-hover)"
            e.currentTarget.style.color = "var(--color-text-primary)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.color = "var(--color-text-tertiary)"
          }}
        >
          Expand
        </button>
        <button
          style={{
            ...actionBtn,
            color: isBookmarked ? "var(--color-accent)" : undefined,
          }}
          onClick={handleBookmark}
          onMouseEnter={e => {
            if (!isBookmarked) {
              e.currentTarget.style.background = "var(--color-surface-hover)"
              e.currentTarget.style.color = "var(--color-text-primary)"
            }
          }}
          onMouseLeave={e => {
            if (!isBookmarked) {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.color = "var(--color-text-tertiary)"
            }
          }}
        >
          {isBookmarked ? "Bookmarked" : "Bookmark"}
        </button>
      </div>
    </div>
  )
}
