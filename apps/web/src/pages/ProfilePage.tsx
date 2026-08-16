import { useNavigate, Link } from "react-router-dom"
import { useProfile } from "~web/hooks/useProfile.ts"
import { signOut } from "~web/lib/auth-client.ts"

import type { Profile, ProfileActivityItem } from "~web/lib/api-client.ts"

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--color-bg)",
  color: "var(--color-text-primary)",
  fontFamily: "var(--font-sans)",
}

const topBarStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: "var(--z-top-bar)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "var(--space-md) var(--space-xl)",
  background: "rgba(26, 26, 26, 0.85)",
  backdropFilter: "blur(12px)",
  borderBottom: "1px solid var(--color-border)",
}

const logoStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-sm)",
  fontSize: "var(--font-size-base)",
  fontWeight: "var(--font-weight-semibold)",
  letterSpacing: "var(--letter-spacing-tight)",
  color: "var(--color-text-primary)",
  textDecoration: "none",
}

const iconButton: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 12px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-secondary)",
  fontSize: "var(--font-size-sm)",
  fontWeight: "var(--font-weight-medium)",
  cursor: "pointer",
  transition: "all var(--transition-fast)",
}

const containerStyle: React.CSSProperties = {
  maxWidth: 920,
  margin: "0 auto",
  padding: "var(--space-xl) var(--space-lg) var(--space-2xl)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-xl)",
}

function Card({
  title,
  children,
  action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-lg)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "var(--font-size-base)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-text-primary)",
            letterSpacing: "var(--letter-spacing-tight)",
          }}
        >
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

const emptyText: React.CSSProperties = {
  fontSize: "var(--font-size-sm)",
  color: "var(--color-text-tertiary)",
  padding: "var(--space-sm) 0",
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string
  value: number | string
  accent?: boolean
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 110,
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-md)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: "var(--font-size-2xl)",
          fontWeight: "var(--font-weight-bold)",
          color: accent ? "var(--color-accent)" : "var(--color-text-primary)",
          letterSpacing: "var(--letter-spacing-tight)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--color-text-tertiary)",
        }}
      >
        {label}
      </div>
    </div>
  )
}

function ActivityIcon({ type }: { type: string }) {
  const paths: Record<string, React.ReactNode> = {
    view: <circle cx="12" cy="12" r="4" />,
    read: (
      <>
        <path d="M2 4h20v14H2z" />
        <path d="M8 21h8" />
      </>
    ),
    bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
    share: (
      <>
        <path d="M4 12v8h16v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" x2="12" y1="2" y2="15" />
      </>
    ),
    expand: (
      <>
        <path d="M8 3H5a2 2 0 0 0-2 2v3" />
        <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
        <path d="M3 16v3a2 2 0 0 0 2 2h3" />
        <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
      </>
    ),
  }
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {paths[type] ?? <circle cx="12" cy="12" r="4" />}
    </svg>
  )
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ""
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ""
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return formatDate(iso)
  } catch {
    return ""
  }
}

function confidenceColor(confidence: number | null): string {
  if (confidence === null) return "var(--color-text-tertiary)"
  if (confidence >= 0.8) return "var(--color-success)"
  if (confidence >= 0.6) return "var(--color-warning)"
  return "var(--color-danger)"
}

function ActivityRow({ item }: { item: ProfileActivityItem }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-sm)",
        padding: "var(--space-sm) 0",
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: "var(--radius-sm)",
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-secondary)",
          flexShrink: 0,
        }}
      >
        <ActivityIcon type={item.interactionType} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          to={`/`}
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-primary)",
            fontWeight: "var(--font-weight-medium)",
            textDecoration: "none",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.story.title}
        </Link>
        <div
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-tertiary)",
          }}
        >
          {item.interactionType}
        </div>
      </div>
      <span
        style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--color-text-tertiary)",
          flexShrink: 0,
        }}
      >
        {formatRelative(item.createdAt)}
      </span>
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useProfile()

  const handleSignOut = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  if (isLoading && !data) {
    return (
      <div style={pageStyle}>
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-lg)",
          }}
        >
          <div
            style={{
              fontSize: "var(--font-size-lg)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--color-text-primary)",
            }}
          >
            Weric
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 0.2, 0.4].map(delay => (
              <div
                key={delay}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                  animation: "pulse 1.4s infinite ease-in-out",
                  animationDelay: `${delay}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div style={pageStyle}>
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-md)",
          }}
        >
          <div
            style={{
              fontSize: "var(--font-size-lg)",
              fontWeight: 600,
              color: "var(--color-danger)",
            }}
          >
            Could not load profile
          </div>
          <button style={iconButton} onClick={() => navigate("/")}>
            ← Back to Home
          </button>
        </div>
      </div>
    )
  }

  const profile: Profile = data
  const u = profile.user
  const initial = (u.name || u.email || "U").charAt(0).toUpperCase()
  const maxInteraction = Math.max(
    ...profile.stats.interactionsByType.map(i => i.count),
    1
  )

  return (
    <div style={pageStyle}>
      <div style={topBarStyle}>
        <Link to="/" style={logoStyle}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          Weric
        </Link>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
          }}
        >
          <button style={iconButton} onClick={() => navigate("/")}>
            ← Home
          </button>
          <button
            style={{ ...iconButton, color: "var(--color-danger)" }}
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={containerStyle}>
        {/* Profile header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-lg)",
            padding: "var(--space-lg)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {u.image ? (
            <img
              src={u.image}
              alt={u.name}
              style={{
                width: 72,
                height: 72,
                borderRadius: "var(--radius-full)",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "var(--radius-full)",
                background:
                  "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "var(--font-size-2xl)",
                fontWeight: "var(--font-weight-bold)",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "var(--font-size-2xl)",
                fontWeight: "var(--font-weight-bold)",
                letterSpacing: "var(--letter-spacing-tight)",
              }}
            >
              {u.name}
            </div>
            <div
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-secondary)",
              }}
            >
              {u.displayUsername ?? (u.username ? `@${u.username}` : u.email)}
            </div>
            <div
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-tertiary)",
                marginTop: 6,
              }}
            >
              Member since {formatDate(u.createdAt)}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap" }}
        >
          <StatCard label="Searches" value={profile.stats.chats} />
          <StatCard label="Stories" value={profile.stats.stories} accent />
          <StatCard label="Bookmarks" value={profile.stats.bookmarks} />
          <StatCard label="Interests" value={profile.stats.interests} />
          <StatCard label="Interactions" value={profile.stats.interactions} />
        </div>

        {/* Interests */}
        <Card title="Interests">
          {profile.interests.length === 0 && (
            <div style={emptyText}>
              No interests yet. Searching and reading stories will build your
              interest profile.
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: "var(--space-sm)",
              flexWrap: "wrap",
            }}
          >
            {profile.interests.map(interest => (
              <span
                key={interest.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: "var(--font-weight-medium)",
                  color: "var(--color-accent)",
                  background: "rgba(99, 102, 241, 0.1)",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                }}
              >
                {interest.topic}
                <span
                  style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  {Math.round(interest.score * 100)}%
                </span>
              </span>
            ))}
          </div>
        </Card>

        {/* Interactions breakdown */}
        {profile.stats.interactionsByType.length > 0 && (
          <Card title="Engagement">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-sm)",
              }}
            >
              {profile.stats.interactionsByType.map(row => (
                <div
                  key={row.interactionType}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-sm)",
                  }}
                >
                  <span
                    style={{
                      width: 90,
                      fontSize: "var(--font-size-xs)",
                      color: "var(--color-text-secondary)",
                      textTransform: "capitalize",
                    }}
                  >
                    {row.interactionType}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: "var(--radius-full)",
                      background: "var(--color-bg-tertiary)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(row.count / maxInteraction) * 100}%`,
                        height: "100%",
                        borderRadius: "var(--radius-full)",
                        background: "var(--color-accent)",
                        transition: "width var(--transition-base)",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      width: 40,
                      textAlign: "right",
                      fontSize: "var(--font-size-xs)",
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Bookmarks */}
        <Card
          title={`Bookmarks (${profile.bookmarks.length})`}
          action={
            <Link
              to="/"
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--color-accent)",
                textDecoration: "none",
              }}
            >
              Explore →
            </Link>
          }
        >
          {profile.bookmarks.length === 0 && (
            <div style={emptyText}>
              No bookmarks yet. Bookmark stories to revisit them here.
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {profile.bookmarks.map(bm => (
              <div
                key={bm.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                  padding: "var(--space-sm) 0",
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link
                    to="/"
                    style={{
                      fontSize: "var(--font-size-sm)",
                      fontWeight: "var(--font-weight-medium)",
                      color: "var(--color-text-primary)",
                      textDecoration: "none",
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {bm.story.title}
                  </Link>
                  <div
                    style={{
                      fontSize: "var(--font-size-xs)",
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    {bm.story.evidenceCount} sources · bookmarked{" "}
                    {formatDate(bm.createdAt)}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "var(--font-size-xs)",
                    fontWeight: "var(--font-weight-medium)",
                    color: confidenceColor(bm.story.confidence),
                    flexShrink: 0,
                  }}
                >
                  {bm.story.confidence !== null
                    ? `${Math.round(bm.story.confidence * 100)}%`
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent chats */}
        <Card title="Recent searches">
          {profile.recentChats.length === 0 && (
            <div style={emptyText}>
              No searches yet. Run a search from the home page to start
              collecting sessions.
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {profile.recentChats.map(chat => (
              <div
                key={chat.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                  padding: "var(--space-sm) 0",
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-text-tertiary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "var(--font-size-sm)",
                      fontWeight: "var(--font-weight-medium)",
                      color: "var(--color-text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {chat.title}
                  </div>
                  {chat.query && (
                    <div
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-tertiary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {chat.query}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-tertiary)",
                    flexShrink: 0,
                  }}
                >
                  {chat.storyCount} stories
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity */}
        <Card title="Recent activity">
          {profile.activity.length === 0 && (
            <div style={emptyText}>
              No activity yet. Your interactions will show up here.
            </div>
          )}
          <div>
            {profile.activity.map(item => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
