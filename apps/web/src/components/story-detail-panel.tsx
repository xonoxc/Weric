import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { IconLayoutSidebarFilled } from "@tabler/icons-react"
import { fetchStoryDetail } from "~web/lib/api-client.ts"

export interface ExpandableStory {
  id: string
  slug?: string
  title: string
}

interface StoryDetailPanelProps {
  story: ExpandableStory | null
  onClose: () => void
}

const panelStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  background: "var(--color-surface)",
  borderLeft: "1px solid var(--color-border)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
}

const headerStyle: React.CSSProperties = {
  padding: "var(--space-lg)",
  borderBottom: "1px solid var(--color-border)",
  display: "flex",
  alignItems: "flex-start",
  gap: "var(--space-sm)",
  flexShrink: 0,
}

const bodyStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "var(--space-lg)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-md)",
}

const closeBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-secondary)",
  cursor: "pointer",
  flexShrink: 0,
  fontSize: 14,
  lineHeight: 1,
  transition: "all var(--transition-fast)",
}

const sectionLabel: React.CSSProperties = {
  fontSize: "var(--font-size-xs)",
  color: "var(--color-text-tertiary)",
  fontWeight: "var(--font-weight-medium)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  marginBottom: 8,
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

export function StoryDetailPanel({ story, onClose }: StoryDetailPanelProps) {
  const detailQuery = useQuery({
    queryKey: ["story-detail", story?.slug],
    queryFn: () => fetchStoryDetail(story!.slug!),
    enabled: !!story?.slug,
  })

  useEffect(() => {
    if (!story) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [story, onClose])

  if (!story) return null

  const detail = detailQuery.data
  const confidence = detail?.confidence ?? null

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "var(--font-size-lg)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--color-text-primary)",
              lineHeight: "var(--line-height-tight)",
              letterSpacing: "var(--letter-spacing-tight)",
            }}
          >
            {story.title}
          </div>
          {confidence !== null && (
            <div
              style={{
                marginTop: 8,
                fontSize: "var(--font-size-xs)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--color-accent)",
              }}
            >
              {Math.round(confidence * 100)}% confidence
            </div>
          )}
        </div>
        <button
          style={{
            ...closeBtn,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={onClose}
          onMouseEnter={e => {
            e.currentTarget.style.background = "var(--color-surface-hover)"
            e.currentTarget.style.color = "var(--color-text-primary)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "var(--color-surface)"
            e.currentTarget.style.color = "var(--color-text-secondary)"
          }}
          title="Close"
        >
          <IconLayoutSidebarFilled size={16} stroke={2} />
        </button>
      </div>

      <div style={bodyStyle}>
        {!detailQuery.isSuccess && detailQuery.isLoading && (
          <div
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-tertiary)",
            }}
          >
            Loading...
          </div>
        )}

        {detailQuery.isError && (
          <div
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-danger)",
            }}
          >
            Could not load story details.
          </div>
        )}

        {detail && (
          <>
            {detail.summary && (
              <div
                style={{
                  fontSize: "var(--font-size-base)",
                  color: "var(--color-text-secondary)",
                  lineHeight: "var(--line-height-relaxed)",
                  userSelect: "text",
                  whiteSpace: "pre-wrap",
                }}
              >
                {detail.summary}
              </div>
            )}

            {detail.entities.length > 0 && (
              <div>
                <div style={sectionLabel}>Entities</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {detail.entities.map(entity => (
                    <span
                      key={entity.id}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-accent)",
                        background: "rgba(99, 102, 241, 0.1)",
                        border: "1px solid rgba(99, 102, 241, 0.2)",
                      }}
                    >
                      {entity.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div style={sectionLabel}>Sources ({detail.evidence.length})</div>
              {detail.evidence.length === 0 && (
                <div
                  style={{
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  No sources linked yet.
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {detail.evidence.map(evidence => (
                  <a
                    key={evidence.id}
                    href={evidence.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      padding: "10px 12px",
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-bg-secondary)",
                      border: "1px solid var(--color-border)",
                      textDecoration: "none",
                      transition: "all var(--transition-fast)",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor =
                        "var(--color-border-hover)"
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "var(--color-border)"
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--font-size-sm)",
                        fontWeight: "var(--font-weight-medium)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {evidence.title}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-tertiary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {evidence.url}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-tertiary)",
                      }}
                    >
                      {[
                        evidence.source,
                        evidence.author,
                        formatDate(evidence.publishedAt),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
