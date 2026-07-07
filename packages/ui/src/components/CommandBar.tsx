import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"

interface Suggestion {
  label: string
  query: string
}

const rotatingPlaceholders = [
  "Ask Weric anything...",
  "Explain MCP.",
  "What happened today?",
  "Continue yesterday's research.",
  "Compare Claude and GPT.",
  "Show Rust updates.",
  "Summarize today's AI news.",
]

const defaultSuggestions: Suggestion[] = [
  { label: "Explain MCP", query: "explain MCP" },
  { label: "What happened today?", query: "today news" },
  { label: "Continue yesterday's research", query: "yesterday research" },
  { label: "Show Rust updates", query: "Rust latest" },
  { label: "Compare Claude and GPT", query: "Claude vs GPT" },
  { label: "Summarize today's AI news", query: "AI news today" },
]

const relatedTopics = ["Anthropic", "OpenAI", "Claude", "LangGraph"]

const availableSources = [
  "Reddit",
  "GitHub",
  "Official Docs",
  "Blogs",
  "Hacker News",
]

interface CommandBarProps {
  onSearch?: (query: string) => void
  suggestions?: Suggestion[]
}

const iconBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-text-tertiary)",
  cursor: "pointer",
  transition: "all var(--transition-fast)",
  background: "transparent",
  border: "none",
  flexShrink: 0,
}

const chip: React.CSSProperties = {
  padding: "4px 12px",
  borderRadius: "var(--radius-full)",
  fontSize: "var(--font-size-xs)",
  color: "var(--color-text-secondary)",
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  cursor: "pointer",
  transition: "all var(--transition-fast)",
  letterSpacing: "var(--letter-spacing-base)",
}

const sectionLabel: React.CSSProperties = {
  fontSize: "var(--font-size-xs)",
  color: "var(--color-text-tertiary)",
  fontWeight: "var(--font-weight-medium)",
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
}

export function CommandBar({
  onSearch,
  suggestions = defaultSuggestions,
}: CommandBarProps) {
  const [query, setQuery] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [focused, setFocused] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focused) return
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % rotatingPlaceholders.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [focused])

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        textareaRef.current?.focus()
      }
      if (e.key === "Escape") {
        textareaRef.current?.blur()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`
    }
  }, [])

  useEffect(() => {
    autoResize()
  }, [query, autoResize])

  const handleSubmit = useCallback(
    (q?: string) => {
      const tagStr = tags.map(t => `[${t}]`).join(" ")
      const text = q ?? query
      const value = [tagStr, text].filter(Boolean).join(" ")
      if (value.trim()) {
        onSearch?.(value.trim())
        setQuery("")
        setTags([])
        setSelectedIndex(-1)
        textareaRef.current?.blur()
      }
    },
    [query, tags, onSearch]
  )

  const handleRemoveTag = useCallback((tag: string) => {
    setTags(prev => prev.filter(t => t !== tag))
  }, [])

  const handleAddTag = useCallback((tag: string) => {
    setTags(prev => (prev.includes(tag) ? prev : [...prev, tag]))
    textareaRef.current?.focus()
  }, [])

  const handleSuggestionClick = useCallback(
    (s: Suggestion) => {
      setQuery(s.query)
      handleSubmit(s.query)
    },
    [handleSubmit]
  )

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1))
        return
      }
    },
    [handleSubmit, suggestions.length]
  )

  const hasContent = query.length > 0 || tags.length > 0
  const showPanel = focused

  return (
    <div
      ref={wrapperRef}
      role="search"
      aria-label="Command bar"
      style={{
        position: "fixed",
        bottom: "var(--space-lg)",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(48%, calc(100vw - var(--space-2xl)))",
        zIndex: "var(--z-command-bar)",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {showPanel && (
        <div
          style={{
            width: "100%",
            background: "var(--color-bg-tertiary)",
            border: "1px solid var(--color-border-hover)",
            borderBottom: "none",
            borderRadius: "14px 14px 0 0",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            animation: "fadeSlideUp 300ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div style={{ padding: "var(--space-md) var(--space-md) 0" }}>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>Suggestions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "var(--font-size-sm)",
                    color:
                      selectedIndex === i
                        ? "var(--color-text-primary)"
                        : "var(--color-text-secondary)",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-sm)",
                    background:
                      selectedIndex === i
                        ? "var(--color-surface-hover)"
                        : "transparent",
                    border: "none",
                    textAlign: "left",
                    width: "100%",
                  }}
                  onMouseDown={e => {
                    e.preventDefault()
                    handleSuggestionClick(s)
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background =
                      "var(--color-surface-hover)"
                    e.currentTarget.style.color = "var(--color-text-primary)"
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background =
                      selectedIndex === i
                        ? "var(--color-surface-hover)"
                        : "transparent"
                    e.currentTarget.style.color =
                      selectedIndex === i
                        ? "var(--color-text-primary)"
                        : "var(--color-text-secondary)"
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0, opacity: 0.5 }}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: "var(--space-sm) var(--space-md)",
              borderTop: "1px solid var(--color-border)",
              marginTop: "var(--space-sm)",
            }}
          >
            <div style={{ ...sectionLabel, marginBottom: 8 }}>
              Active Context
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["AI", "Today", "Rust", "Bookmarks"].map(tag => (
                <span
                  key={tag}
                  style={{
                    ...chip,
                    background: "var(--color-bg-secondary)",
                  }}
                  onClick={() => handleAddTag(tag)}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor =
                      "var(--color-border-active)"
                    e.currentTarget.style.color = "var(--color-text-primary)"
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "var(--color-border)"
                    e.currentTarget.style.color = "var(--color-text-secondary)"
                  }}
                >
                  {tag}
                </span>
              ))}
              <span
                style={{
                  ...chip,
                  borderStyle: "dashed",
                  color: "var(--color-text-tertiary)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = "var(--color-text-primary)"
                  e.currentTarget.style.borderColor =
                    "var(--color-border-active)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "var(--color-text-tertiary)"
                  e.currentTarget.style.borderColor = "var(--color-border)"
                }}
              >
                + Add
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "var(--space-md)",
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-md)",
            }}
          >
            <div>
              <div style={{ ...sectionLabel, marginBottom: 8 }}>
                Related Topics
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {relatedTopics.map(topic => (
                  <span
                    key={topic}
                    style={chip}
                    onClick={() => handleAddTag(topic)}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor =
                        "var(--color-border-active)"
                      e.currentTarget.style.color = "var(--color-text-primary)"
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "var(--color-border)"
                      e.currentTarget.style.color =
                        "var(--color-text-secondary)"
                    }}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ ...sectionLabel, marginBottom: 8 }}>
                Available Sources
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {availableSources.map(source => (
                  <span
                    key={source}
                    style={chip}
                    onClick={() => handleAddTag(source)}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor =
                        "var(--color-border-active)"
                      e.currentTarget.style.color = "var(--color-text-primary)"
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "var(--color-border)"
                      e.currentTarget.style.color =
                        "var(--color-text-secondary)"
                    }}
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "var(--space-sm) var(--space-md)",
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              <span style={footerAction}>Attach</span>
              <span style={footerAction}>Voice</span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <span
                style={{
                  ...footerAction,
                  color: "var(--color-text-tertiary)",
                }}
              >
                Enter ↵
              </span>
              <span
                style={{
                  ...footerAction,
                  color: "var(--color-text-tertiary)",
                }}
              >
                ⌘K
              </span>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          width: "100%",
          background: focused
            ? "var(--color-bg-tertiary)"
            : "var(--color-surface)",
          border: `1px solid ${
            focused || hasContent
              ? "var(--color-border-hover)"
              : "var(--color-border)"
          }`,
          borderRadius: showPanel ? "0 0 14px 14px" : 14,
          boxShadow: focused
            ? "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)"
            : "var(--shadow-lg)",
          transition: "all 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <div
          style={{
            padding:
              tags.length > 0 || query
                ? "var(--space-xs) var(--space-sm)"
                : "2px 6px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--space-sm)",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: hasContent ? 36 : 32,
                height: hasContent ? 36 : 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color:
                  focused || hasContent
                    ? "var(--color-accent)"
                    : "var(--color-text-tertiary)",
                transition: "color var(--transition-base)",
              }}
            >
              <svg
                width={hasContent ? 18 : 16}
                height={hasContent ? 18 : 16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {tags.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 4px 2px 10px",
                        borderRadius: 6,
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-accent-hover)",
                        background: "rgba(99, 102, 241, 0.1)",
                        border: "1px solid rgba(99, 102, 241, 0.2)",
                        lineHeight: "20px",
                      }}
                    >
                      {tag}
                      <button
                        style={{
                          width: 16,
                          height: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 4,
                          border: "none",
                          background: "transparent",
                          color: "var(--color-accent-hover)",
                          cursor: "pointer",
                          padding: 0,
                          fontSize: 12,
                          lineHeight: 1,
                          opacity: 0.6,
                          transition: "opacity var(--transition-fast)",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.opacity = "1"
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.opacity = "0.6"
                        }}
                        onClick={() => handleRemoveTag(tag)}
                        aria-label={`Remove ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={query}
                placeholder={
                  tags.length > 0
                    ? "Add more context..."
                    : rotatingPlaceholders[placeholderIndex]
                }
                onChange={e => {
                  setQuery(e.target.value)
                }}
                onFocus={() => {
                  setFocused(true)
                  setSelectedIndex(-1)
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setFocused(false)
                    setSelectedIndex(-1)
                  }, 200)
                }}
                onKeyDown={handleKeyDown}
                rows={1}
                aria-label="Ask Weric anything"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--color-text-primary)",
                  fontSize:
                    tags.length > 0 || query ? "var(--font-size-base)" : 14,
                  lineHeight: "24px",
                  padding: tags.length > 0 || query ? "2px 0 4px" : 0,
                  fontFamily: "var(--font-sans)",
                  resize: "none",
                  minHeight: tags.length > 0 || query ? 24 : 28,
                  overflow: "hidden",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexShrink: 0,
                paddingTop: tags.length > 0 ? 2 : 0,
              }}
            >
              <button
                style={{
                  ...iconBtn,
                  width: hasContent ? 32 : 28,
                  height: hasContent ? 32 : 28,
                }}
                title="Attach file"
                onMouseEnter={e => {
                  e.currentTarget.style.background =
                    "var(--color-surface-hover)"
                  e.currentTarget.style.color = "var(--color-text-secondary)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "var(--color-text-tertiary)"
                }}
              >
                <svg
                  width={hasContent ? 16 : 14}
                  height={hasContent ? 16 : 14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <button
                style={{
                  ...iconBtn,
                  width: hasContent ? 32 : 28,
                  height: hasContent ? 32 : 28,
                }}
                title="Voice input"
                onMouseEnter={e => {
                  e.currentTarget.style.background =
                    "var(--color-surface-hover)"
                  e.currentTarget.style.color = "var(--color-text-secondary)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "var(--color-text-tertiary)"
                }}
              >
                <svg
                  width={hasContent ? 16 : 14}
                  height={hasContent ? 16 : 14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </button>
              <button
                style={{
                  ...iconBtn,
                  width: hasContent ? 32 : 28,
                  height: hasContent ? 32 : 28,
                  background: hasContent
                    ? "var(--color-accent)"
                    : "transparent",
                  color: hasContent ? "white" : "var(--color-text-tertiary)",
                  borderRadius: "var(--radius-sm)",
                  transition: "all var(--transition-fast)",
                }}
                onClick={() => handleSubmit()}
                disabled={!hasContent}
                title="Send"
              >
                <svg
                  width={hasContent ? 15 : 13}
                  height={hasContent ? 15 : 13}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" x2="11" y1="2" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const footerAction: React.CSSProperties = {
  fontSize: "var(--font-size-xs)",
  color: "var(--color-text-disabled)",
  letterSpacing: "var(--letter-spacing-base)",
  padding: "2px 6px",
  borderRadius: "var(--radius-xs)",
  background: "var(--color-surface)",
}
