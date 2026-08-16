import { useState } from "react"

interface SearchFormProps {
  onSearch?: (query: string) => void
}

const formStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  margin: "var(--space-sm) var(--space-sm) 0",
  padding: "6px var(--space-sm)",
  borderRadius: "var(--radius-md)",
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  background: "transparent",
  border: "none",
  outline: "none",
  color: "var(--color-text-primary)",
  fontSize: "var(--font-size-sm)",
  fontFamily: "var(--font-sans)",
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [query, setQuery] = useState("")

  return (
    <form
      role="search"
      onSubmit={e => {
        e.preventDefault()
        if (query.trim()) onSearch?.(query.trim())
      }}
      style={formStyle}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }}
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        placeholder="Type to search..."
        aria-label="Search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={inputStyle}
      />
    </form>
  )
}
