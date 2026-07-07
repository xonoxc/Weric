import { useHome } from "../hooks/useHome.ts"
import { Canvas, StoryCard, CommandBar, TopBar } from "@weric/ui"

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
    handleSearch,
    handleExpand,
    handleBookmark,
    handleSignOut,
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
          borderRadius: "var(--radius-sm)",
          color: "var(--color-text-secondary)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          transition: "all var(--transition-fast)",
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
        {userInitial}
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
            <button
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: 13,
                color: "var(--color-text-secondary)",
                borderRadius: "var(--radius-xs)",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                textAlign: "left",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "var(--color-surface-hover)"
                e.currentTarget.style.color = "var(--color-text-primary)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.color = "var(--color-text-secondary)"
              }}
              onClick={handleSignOut}
            >
              Sign out
            </button>
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
            Connection issue
          </div>
          <div style={emptySubtitle}>{error}</div>
        </div>
      )}
      <CommandBar onSearch={handleSearch} />
    </>
  )
}
