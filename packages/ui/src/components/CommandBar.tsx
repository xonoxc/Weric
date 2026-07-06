import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
} from "react"

interface Suggestion {
  label: string
  query: string
}

const defaultSuggestions: Suggestion[] = [
  { label: "What happened today?", query: "today" },
  { label: "Explain MCP", query: "MCP" },
  { label: "Compare Claude and GPT", query: "Claude GPT comparison" },
  { label: "Show AI Runtime news", query: "AI Runtime" },
]

interface CommandBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
  suggestions?: Suggestion[]
}

const wrapperStyle: React.CSSProperties = {
  position: "fixed",
  bottom: "var(--space-lg)",
  left: "50%",
  transform: "translateX(-50%)",
  width: "min(640px, calc(100vw - var(--space-2xl)))",
  zIndex: "var(--z-command-bar)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-sm)",
}

const inputContainer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-sm)",
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-xl)",
  padding: "var(--space-sm) var(--space-md)",
  boxShadow: "var(--shadow-lg)",
  backdropFilter: "blur(20px)",
  transition: "all var(--transition-base)",
}

const inputFocused: React.CSSProperties = {
  borderColor: "var(--color-border-hover)",
  boxShadow: "var(--shadow-xl), 0 0 0 1px rgba(99, 102, 241, 0.15)",
}

const input: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  outline: "none",
  color: "var(--color-text-primary)",
  fontSize: "var(--font-size-base)",
  lineHeight: "24px",
  padding: "var(--space-xs) 0",
}

const actionsRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-xs)",
  color: "var(--color-text-tertiary)",
}

const iconBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--radius-xs)",
  color: "var(--color-text-tertiary)",
  cursor: "pointer",
  transition: "all var(--transition-fast)",
  background: "transparent",
  border: "none",
}

const suggestionsContainer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: "var(--space-xs)",
  boxShadow: "var(--shadow-lg)",
  backdropFilter: "blur(20px)",
}

const suggestionItem: React.CSSProperties = {
  padding: "var(--space-sm) var(--space-md)",
  borderRadius: "var(--radius-sm)",
  fontSize: "var(--font-size-sm)",
  color: "var(--color-text-secondary)",
  cursor: "pointer",
  transition: "all var(--transition-fast)",
  display: "flex",
  alignItems: "center",
  gap: "var(--space-sm)",
  background: "transparent",
  border: "none",
  textAlign: "left",
  width: "100%",
}

export function CommandBar({
  onSearch,
  placeholder = "Ask Weric anything...",
  suggestions = defaultSuggestions,
}: CommandBarProps) {
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handler as any)
    return () => window.removeEventListener("keydown", handler as any)
  }, [])

  const handleSubmit = useCallback(
    (q?: string) => {
      const value = q ?? query
      if (value.trim()) {
        onSearch?.(value.trim())
        setQuery("")
        setShowSuggestions(false)
        inputRef.current?.blur()
      }
    },
    [query, onSearch]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSubmit()
      }
      if (e.key === "Escape") {
        setShowSuggestions(false)
        inputRef.current?.blur()
      }
    },
    [handleSubmit]
  )

  const handleSuggestionClick = useCallback(
    (s: Suggestion) => {
      setQuery(s.query)
      handleSubmit(s.query)
    },
    [handleSubmit]
  )

  return (
    <div style={wrapperStyle} role="search">
      <div
        style={{
          ...inputContainer,
          ...(focused ? inputFocused : {}),
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, color: "var(--color-text-tertiary)" }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          style={input}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={e => {
            setQuery(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => {
            setFocused(true)
            setShowSuggestions(true)
          }}
          onBlur={() => {
            setFocused(false)
            setTimeout(() => setShowSuggestions(false), 200)
          }}
          onKeyDown={handleKeyDown}
          aria-label="Search"
        />
        <div style={actionsRow}>
          <button
            style={iconBtn}
            title="Attach file"
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--color-surface-hover)"
              e.currentTarget.style.color = "var(--color-text-secondary)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.color = "var(--color-text-tertiary)"
            }}
          >
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
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <button
            style={iconBtn}
            title="Voice input"
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--color-surface-hover)"
              e.currentTarget.style.color = "var(--color-text-secondary)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.color = "var(--color-text-tertiary)"
            }}
          >
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
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>
          <button
            style={{
              ...iconBtn,
              background: query.trim() ? "var(--color-accent)" : "transparent",
              color: query.trim() ? "white" : "var(--color-text-tertiary)",
              borderRadius: "var(--radius-sm)",
            }}
            onClick={() => handleSubmit()}
            disabled={!query.trim()}
            title="Send"
          >
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
              <line x1="22" x2="11" y1="2" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
      {showSuggestions && !query && (
        <div style={suggestionsContainer}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              style={suggestionItem}
              onMouseDown={e => {
                e.preventDefault()
                handleSuggestionClick(s)
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "var(--color-surface-hover)"
                e.currentTarget.style.color = "var(--color-text-primary)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.color = "var(--color-text-secondary)"
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
                style={{ flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
