import { useState } from "react"
import {
  IconChartBubble,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { Button } from "@weric/ui"
import type { ChatListRow } from "~web/lib/api-client.ts"

interface ChatSidebarProps {
  chats: ChatListRow[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNewChat: () => void
  onDelete: (id: string) => void
}

export function ChatSidebar({
  chats,
  selectedId,
  onSelect,
  onNewChat,
  onDelete,
}: ChatSidebarProps) {
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const trimmed = query.trim()
  const filtered = trimmed
    ? chats.filter(chat =>
        chat.title.toLowerCase().includes(trimmed.toLowerCase())
      )
    : chats

  return (
    <div className="flex h-full w-full flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex shrink-0 items-center justify-between px-5 pt-4 pb-2">
        <span className="select-none text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
          Weric
        </span>
        <button
          type="button"
          title="Search chats"
          aria-label="Search chats"
          onClick={() => {
            setSearching(s => !s)
            setQuery("")
          }}
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
        >
          {searching ? (
            <IconX className="h-4 w-4" />
          ) : (
            <IconSearch className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-5 py-3">
        <Button
          type="button"
          onClick={onNewChat}
          title="New chat"
          className="flex h-[30px] w-full items-center justify-start gap-1.5 rounded-[var(--radius-sm)] border border-[rgba(99,102,241,0.2)] bg-[rgba(99,102,241,0.1)] px-2 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[rgba(99,102,241,0.18)]"
        >
          <IconPlus className="stroke-2" />
          <span>New</span>
        </Button>

        {searching && (
          <div className="relative mt-2">
            <IconSearch className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search chats"
              className="h-8 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-hover)] pr-2 pl-7 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
        )}

        <div className="pt-2 pb-1 text-[11px] tracking-tight text-[var(--color-text-tertiary)]">
          Your chats
        </div>

        {filtered.length === 0 ? (
          <div className="py-3 text-center text-[11px] text-[var(--color-text-tertiary)]">
            {trimmed ? "No matching chats." : "No chats yet. Start a search."}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filtered.map(chat => {
              const selected = chat.id === selectedId
              return (
                <div
                  key={chat.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(chat.id)}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onSelect(chat.id)
                    }
                  }}
                  className={`group flex h-9 w-full cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 text-[13px] transition-colors ${
                    selected
                      ? "bg-[var(--color-surface-active)] text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  <IconChartBubble />
                  <span className="min-w-0 flex-1 truncate">{chat.title}</span>
                  <span className="shrink-0 text-[11px] text-[var(--color-text-tertiary)]">
                    {chat.storyCount}
                  </span>
                  <button
                    type="button"
                    aria-label={`Delete ${chat.title}`}
                    onClick={e => {
                      e.stopPropagation()
                      onDelete(chat.id)
                    }}
                    className="hidden h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-xs)] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-danger)] group-hover:flex group-focus-within:flex"
                  >
                    <IconTrash />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 truncate border-t border-[var(--color-border)] px-4 py-3 text-[11px] text-[var(--color-text-tertiary)]">
        Stories persist per chat
      </div>
    </div>
  )
}
