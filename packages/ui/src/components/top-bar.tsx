import type { ReactNode } from "react"

interface TopBarProps {
  logo?: ReactNode
  actions?: ReactNode
}

export function TopBar({ logo = "Weric", actions }: TopBarProps) {
  return (
    <div
      className="pointer-events-none fixed top-0 right-0 left-0 z-[var(--z-top-bar)] flex items-center justify-between px-6 py-4"
      style={{
        background:
          "linear-gradient(180deg, rgba(26,26,26,0.95) 0%, transparent 100%)",
      }}
    >
      <div className="pointer-events-auto text-sm font-semibold tracking-tight text-[var(--color-text-primary)] select-none">
        {logo}
      </div>
      <div className="pointer-events-auto flex items-center gap-2">
        {actions}
      </div>
    </div>
  )
}
