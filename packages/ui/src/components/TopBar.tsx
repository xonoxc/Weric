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
} as const

interface TopBarProps {
  logo?: ReactNode
  actions?: ReactNode
}

export function TopBar({ logo = "Weric", actions }: TopBarProps) {
  return (
    <div style={styles.bar}>
      <div style={styles.logo}>{logo}</div>
      <div style={styles.actions}>{actions}</div>
    </div>
  )
}
