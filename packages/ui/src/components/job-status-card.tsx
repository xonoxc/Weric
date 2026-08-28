interface SseDiscoveredStory {
  id: string
  title: string
  slug: string
  summary: string
  confidence: number
}

interface JobStatusCardProps {
  visible: boolean
  progress: number
  message: string
  stories: SseDiscoveredStory[]
  status: "idle" | "running" | "completed" | "failed"
  onDismiss?: () => void
  onStoryClick?: (story: SseDiscoveredStory) => void
}

const cardStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 80,
  left: "var(--space-xl)",
  width: 320,
  background: "var(--color-surface)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--color-border)",
  boxShadow: "var(--shadow-lg)",
  padding: "var(--space-md)",
  zIndex: "var(--z-overlay)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-sm)",
  transition: "all var(--transition-base)",
}

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}

const titleText: React.CSSProperties = {
  fontSize: "var(--font-size-sm)",
  fontWeight: "var(--font-weight-semibold)",
  color: "var(--color-text-primary)",
  letterSpacing: "var(--letter-spacing-tight)",
}

const statusDot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  flexShrink: 0,
}

const progressTrack: React.CSSProperties = {
  width: "100%",
  height: 4,
  background: "var(--color-surface-hover)",
  borderRadius: 2,
  overflow: "hidden",
}

const progressFill: React.CSSProperties = {
  height: "100%",
  borderRadius: 2,
  transition: "width 0.3s ease",
}

const messageText: React.CSSProperties = {
  fontSize: "var(--font-size-xs)",
  color: "var(--color-text-secondary)",
  lineHeight: "var(--line-height-relaxed)",
}

const storyListItem: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: "var(--radius-xs)",
  fontSize: "var(--font-size-xs)",
  color: "var(--color-text-secondary)",
  cursor: "pointer",
  transition: "all var(--transition-fast)",
  display: "flex",
  alignItems: "center",
  gap: 6,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}

const storiesList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  maxHeight: 120,
  overflowY: "auto",
}

function getStatusColor(status: string): string {
  switch (status) {
    case "running":
      return "var(--color-accent)"
    case "completed":
      return "var(--color-success)"
    case "failed":
      return "var(--color-danger)"
    default:
      return "var(--color-text-tertiary)"
  }
}

const closeBtn: React.CSSProperties = {
  width: 20,
  height: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--radius-xs)",
  border: "none",
  background: "transparent",
  color: "var(--color-text-tertiary)",
  cursor: "pointer",
  fontSize: 14,
  lineHeight: 1,
  padding: 0,
}

export function JobStatusCard({
  visible,
  progress,
  message,
  stories,
  status,
  onDismiss,
  onStoryClick,
}: JobStatusCardProps) {
  if (!visible) return null

  return (
    <div style={cardStyle}>
      <div style={headerRow}>
        <div style={titleText}>Discovery</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              ...statusDot,
              background: getStatusColor(status),
              opacity: status === "running" ? 0.7 : 1,
            }}
          />
          {onDismiss && (
            <button
              style={closeBtn}
              onClick={onDismiss}
              onMouseEnter={e => {
                e.currentTarget.style.background = "var(--color-surface-hover)"
                e.currentTarget.style.color = "var(--color-text-primary)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.color = "var(--color-text-tertiary)"
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={progressTrack}>
        <div
          style={{
            ...progressFill,
            width: `${Math.round(progress * 100)}%`,
            background:
              status === "failed"
                ? "var(--color-danger)"
                : "var(--color-accent)",
          }}
        />
      </div>

      <div style={messageText}>{message}</div>

      {stories.length > 0 && (
        <div style={storiesList}>
          {stories.map(s => (
            <div
              key={s.id}
              style={storyListItem}
              onMouseEnter={e => {
                e.currentTarget.style.background = "var(--color-surface-hover)"
                e.currentTarget.style.color = "var(--color-text-primary)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.color = "var(--color-text-secondary)"
              }}
              onClick={() => onStoryClick?.(s)}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {s.title}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
