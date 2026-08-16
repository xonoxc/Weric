import type { ChatListRow } from "~web/lib/api-client.ts"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from "~web/components/ui/sidebar/Sidebar.tsx"

interface ChatSidebarProps {
  chats: ChatListRow[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNewChat: () => void
  onDelete: (id: string) => void
}

function NewChatButton({ onClick }: { onClick: () => void }) {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <button
      onClick={onClick}
      title={collapsed ? "New chat" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: 6,
        width: collapsed ? 28 : "auto",
        height: 28,
        padding: collapsed ? 0 : "0 10px",
        borderRadius: "var(--radius-sm)",
        fontSize: "var(--font-size-xs)",
        fontWeight: "var(--font-weight-medium)",
        color: "var(--color-accent)",
        cursor: "pointer",
        background: "rgba(99, 102, 241, 0.1)",
        border: "1px solid rgba(99, 102, 241, 0.2)",
        transition: "all var(--transition-fast)",
      }}
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      {!collapsed && <span>New</span>}
    </button>
  )
}

function ChatItem({
  chat,
  selected,
  onSelect,
  onDelete,
}: {
  chat: ChatListRow
  selected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={selected} onClick={onSelect}>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {!collapsed && (
          <span
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {chat.title}
          </span>
        )}
        <SidebarMenuBadge>{chat.storyCount}</SidebarMenuBadge>
      </SidebarMenuButton>
      <SidebarMenuAction onClick={onDelete}>✕</SidebarMenuAction>
    </SidebarMenuItem>
  )
}

export function ChatSidebar({
  chats,
  selectedId,
  onSelect,
  onNewChat,
  onDelete,
}: ChatSidebarProps) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarTrigger />
          <NewChatButton onClick={onNewChat} />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarMenu>
              {chats.length === 0 && (
                <div
                  style={{
                    padding: "var(--space-md) var(--space-sm)",
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-tertiary)",
                    textAlign: "center",
                  }}
                >
                  No chats yet. Run a search to start one.
                </div>
              )}
              {chats.map(chat => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  selected={chat.id === selectedId}
                  onSelect={() => onSelect(chat.id)}
                  onDelete={() => onDelete(chat.id)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-tertiary)",
              padding: "var(--space-xs) var(--space-sm)",
            }}
          >
            Stories persist per chat
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>
  )
}
