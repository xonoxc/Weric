import { useEffect, useState } from "react"
import { useHome } from "~web/hooks/useHome.ts"
import { Canvas, StoryCard, CommandBar, TopBar, JobStatusCard } from "@weric/ui"
import { StoryDetailPanel } from "~web/components/story-detail-panel.tsx"
import { ChatSidebar } from "~web/components/chat-sidebar"
import { UserMenu } from "~web/components/user-menu.tsx"
import { ResizeHandle } from "~web/components/resize-handle.tsx"
import { IconLayoutSidebar, IconLayoutSidebarFilled } from "@tabler/icons-react"

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
  position: "absolute",
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
  const [chatOpen, setChatOpen] = useState(false)
  const [chatWidth, setChatWidth] = useState<number>(256)
  const [detailWidth, setDetailWidth] = useState<number>(420)
  const [detailOpen, setDetailOpen] = useState(false)
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
    chats,
    selectedChatId,
    handleSelectChat,
    handleNewChat,
    handleDeleteChat,
    selectedStory,
    handleCloseDetail,
  } = useHome()

  const topBarActions = (
    <UserMenu
      userName={userName}
      userInitial={userInitial}
      userImage={userImage}
      open={showUserMenu}
      onOpenChange={setShowUserMenu}
      onSignOut={handleSignOut}
    />
  )

  const handleResizeChat = (delta: number) => {
    setChatWidth(prev => Math.max(200, Math.min(480, prev + delta)))
  }

  const handleResizeDetail = (delta: number) => {
    setDetailWidth(prev => Math.max(320, Math.min(640, prev + delta)))
  }

  useEffect(() => {
    if (selectedStory) setDetailOpen(true)
  }, [selectedStory])

  const closeDetail = () => {
    setDetailOpen(false)
    window.setTimeout(handleCloseDetail, 300)
  }

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
      <div className="flex h-screen">
        <div
          style={{
            width: chatOpen ? chatWidth : 0,
            overflow: "hidden",
            transition: "width 300ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className="shrink-0"
        >
          <ChatSidebar
            chats={chats}
            selectedId={selectedChatId}
            onSelect={handleSelectChat}
            onNewChat={handleNewChat}
            onDelete={handleDeleteChat}
          />
        </div>
        {chatOpen && (
          <ResizeHandle direction="right" onResize={handleResizeChat} />
        )}

        <div className="relative min-w-0 flex-1">
          <TopBar
            logo={
              <button
                type="button"
                title={chatOpen ? "Hide chats" : "Show chats"}
                aria-label={chatOpen ? "Hide chats" : "Show chats"}
                onClick={() => setChatOpen(o => !o)}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                style={{ pointerEvents: "auto" }}
              >
                {chatOpen ? (
                  <IconLayoutSidebarFilled />
                ) : (
                  <IconLayoutSidebar stroke={2} />
                )}
              </button>
            }
            actions={topBarActions}
          />
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
            onStoryClick={s => handleExpand(s)}
          />
          <CommandBar onSearch={handleSearch} />
        </div>

        {detailOpen && (
          <ResizeHandle direction="left" onResize={handleResizeDetail} />
        )}
        <div
          style={{
            width: detailOpen ? detailWidth : 0,
            overflow: "hidden",
            transition: "width 300ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className="shrink-0"
        >
          <StoryDetailPanel story={selectedStory} onClose={closeDetail} />
        </div>
      </div>
    </>
  )
}
