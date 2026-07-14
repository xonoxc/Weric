import { useHome } from "../hooks/useHome.ts"
import { Canvas, StoryCard, CommandBar, TopBar, JobStatusCard } from "@weric/ui"

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
  const {
    stories,
    loading,
    error,
    hasSearched,
    showUserMenu,
    setShowUserMenu,
    userName,
    userInitial,
    userImage,
    handleSearch,
    handleExpand,
    handleBookmark,
    handleSignOut,
    jobStatus,
    showJobCard,
    handleDismissJobCard,
  } = useHome()

  const topBarActions = (
    <div style={{ position: "relative" }}>
      <button
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
          color: "var(--color-text-secondary)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          transition: "all var(--transition-fast)",
          overflow: "hidden",
          padding: 0,
        }}
        onClick={() => setShowUserMenu(prev => !prev)}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = "var(--color-border-hover)"
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = "var(--color-border)"
        }}
        title={userName}
      >
        {userImage ? (
          <img
            src={userImage}
            alt={userName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          userInitial
        )}
      </button>
      {showUserMenu && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 49,
            }}
            onClick={() => setShowUserMenu(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: 6,
              minWidth: 180,
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-lg)",
              padding: 4,
              zIndex: 50,
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                fontSize: 13,
                color: "var(--color-text-secondary)",
                borderBottom: "1px solid var(--color-border)",
                marginBottom: 4,
              }}
            >
              {userName}
            </div>
            {[
              {
                label: "Profile",
                icon: "user",
                onClick: () => setShowUserMenu(false),
              },
              {
                label: "Settings",
                icon: "settings",
                onClick: () => setShowUserMenu(false),
              },
              { divider: true },
              { label: "Sign out", icon: "logout", onClick: handleSignOut },
            ].map((item, i) => {
              if ("divider" in item) {
                return (
                  <div
                    key={`divider-${i}`}
                    style={{
                      height: 1,
                      background: "var(--color-border)",
                      margin: "4px 0",
                    }}
                  />
                )
              }
              return (
                <button
                  key={item.label}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: 13,
                    color:
                      item.label === "Sign out"
                        ? "var(--color-danger)"
                        : "var(--color-text-secondary)",
                    borderRadius: "var(--radius-xs)",
                    cursor: "pointer",
                    background: "transparent",
                    border: "none",
                    textAlign: "left",
                    transition: "all var(--transition-fast)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background =
                      "var(--color-surface-hover)"
                    e.currentTarget.style.color = "var(--color-text-primary)"
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.color =
                      item.label === "Sign out"
                        ? "var(--color-danger)"
                        : "var(--color-text-secondary)"
                  }}
                  onClick={item.onClick}
                >
                  {item.icon === "user" ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="8" r="5" />
                      <path d="M20 21a8 8 0 0 0-16 0" />
                    </svg>
                  ) : item.icon === "settings" ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                  )}
                  {item.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )

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
      <TopBar actions={topBarActions} />
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
            Something went wrong
          </div>
          <div style={emptySubtitle}>{error}</div>
        </div>
      )}
      <JobStatusCard
        visible={showJobCard}
        progress={jobStatus.progress}
        message={jobStatus.message}
        stories={jobStatus.stories}
        status={jobStatus.status}
        onDismiss={handleDismissJobCard}
      />
      <CommandBar onSearch={handleSearch} />
    </>
  )
}
