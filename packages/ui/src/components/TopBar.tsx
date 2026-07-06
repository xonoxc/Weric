import { type ReactNode } from "react"

const styles = {
  bar: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: "var(--z-top-bar)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "var(--space-md) var(--space-lg)",
    background:
      "linear-gradient(180deg, rgba(26,26,26,0.95) 0%, transparent 100%)",
    pointerEvents: "none" as const,
  },
  logo: {
    fontFamily: "var(--font-sans)",
    fontSize: "var(--font-size-sm)",
    fontWeight: "var(--font-weight-semibold)",
    letterSpacing: "var(--letter-spacing-tight)",
    color: "var(--color-text-primary)",
    userSelect: "none" as const,
    pointerEvents: "auto" as const,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-sm)",
    pointerEvents: "auto" as const,
  },
  actionBtn: {
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius-sm)",
    color: "var(--color-text-secondary)",
    fontSize: "var(--font-size-sm)",
    transition: "all var(--transition-fast)",
    cursor: "pointer",
  },
} as const

interface TopBarProps {
  logo?: ReactNode
  actions?: ReactNode
}

export function TopBar({ logo = "Weric", actions }: TopBarProps) {
  return (
    <div style={styles.bar}>
      <div style={styles.logo}>{logo}</div>
      <div style={styles.actions}>
        {actions}
        <button
          style={styles.actionBtn}
          title="Notifications"
          onMouseEnter={e => {
            e.currentTarget.style.background = "var(--color-surface)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent"
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
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        <button
          style={styles.actionBtn}
          title="Settings"
          onMouseEnter={e => {
            e.currentTarget.style.background = "var(--color-surface)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent"
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
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        <button
          style={styles.actionBtn}
          title="Profile"
          onMouseEnter={e => {
            e.currentTarget.style.background = "var(--color-surface)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent"
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
          >
            <circle cx="12" cy="8" r="5" />
            <path d="M20 21a8 8 0 0 0-16 0" />
          </svg>
        </button>
      </div>
    </div>
  )
}
