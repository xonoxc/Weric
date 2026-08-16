import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react"
import type { ReactNode, CSSProperties, ReactElement } from "react"

const SIDEBAR_WIDTH = 260
const SIDEBAR_WIDTH_ICON = 56
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarState = "expanded" | "collapsed"

interface SidebarContextValue {
  state: SidebarState
  open: boolean
  setOpen: (open: boolean) => void
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext)
  if (!ctx) {
    throw new Error("useSidebar must be used within a <SidebarProvider>")
  }
  return ctx
}

interface SidebarProviderProps {
  children: ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SidebarProvider({
  children,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
}: SidebarProviderProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)

  const open = controlledOpen ?? internalOpen

  const setOpen = useCallback(
    (next: boolean) => {
      setInternalOpen(next)
      onOpenChange?.(next)
    },
    [onOpenChange]
  )

  const toggleSidebar = useCallback(() => {
    setOpen(!open)
  }, [open, setOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT
      ) {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [toggleSidebar])

  const state: SidebarState = open ? "expanded" : "collapsed"

  return (
    <SidebarContext.Provider value={{ state, open, setOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

interface SidebarProps {
  children: ReactNode
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}

export function Sidebar({
  children,
  side = "left",
  variant = "sidebar",
  collapsible = "icon",
}: SidebarProps) {
  const { state, open } = useSidebar()
  const collapsed = state === "collapsed" && collapsible === "icon"

  const base: CSSProperties = {
    position: "fixed",
    top: 0,
    bottom: 0,
    [side]: 0,
    width: collapsed ? SIDEBAR_WIDTH_ICON : SIDEBAR_WIDTH,
    display: "flex",
    flexDirection: "column",
    background: "var(--color-bg-tertiary)",
    borderRight: side === "left" ? "1px solid var(--color-border)" : undefined,
    borderLeft: side === "right" ? "1px solid var(--color-border)" : undefined,
    zIndex: "var(--z-top-bar)",
    transition: "width var(--transition-base)",
    overflow: "hidden",
    boxShadow: variant === "floating" && open ? "var(--shadow-lg)" : undefined,
    borderRadius: variant === "floating" ? "var(--radius-lg)" : undefined,
    margin: variant === "floating" ? "var(--space-sm)" : undefined,
    height: variant === "floating" ? "calc(100% - var(--space-lg))" : undefined,
  }

  const inner: CSSProperties = {
    flex: 1,
    width: collapsed ? SIDEBAR_WIDTH_ICON : SIDEBAR_WIDTH,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transition: "width var(--transition-base)",
  }

  return (
    <div
      style={base}
      data-state={state}
      data-side={side}
      data-variant={variant}
    >
      <div style={inner}>{children}</div>
    </div>
  )
}

const headerStyle: CSSProperties = {
  padding: "var(--space-md)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexShrink: 0,
  borderBottom: "1px solid var(--color-border)",
}

export function SidebarHeader({ children }: { children: ReactNode }) {
  return <div style={headerStyle}>{children}</div>
}

const contentStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  padding: "var(--space-sm)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-md)",
}

export function SidebarContent({ children }: { children: ReactNode }) {
  return <div style={contentStyle}>{children}</div>
}

const footerStyle: CSSProperties = {
  padding: "var(--space-md)",
  display: "flex",
  flexDirection: "column",
  flexShrink: 0,
  borderTop: "1px solid var(--color-border)",
}

export function SidebarFooter({ children }: { children: ReactNode }) {
  return <div style={footerStyle}>{children}</div>
}

const groupStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-xs)",
}

const groupLabelStyle: CSSProperties = {
  fontSize: "var(--font-size-xs)",
  fontWeight: "var(--font-weight-medium)",
  color: "var(--color-text-tertiary)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  padding: "0 var(--space-sm)",
}

export function SidebarGroup({ children }: { children: ReactNode }) {
  return <div style={groupStyle}>{children}</div>
}

export function SidebarGroupLabel({ children }: { children: ReactNode }) {
  return <div style={groupLabelStyle}>{children}</div>
}

const menuStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
}

export function SidebarMenu({ children }: { children: ReactNode }) {
  return <div style={menuStyle}>{children}</div>
}

export function SidebarMenuItem({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
      }}
    >
      {children}
    </div>
  )
}

interface SidebarMenuButtonProps {
  children: ReactNode
  isActive?: boolean
  onClick?: () => void
}

export function SidebarMenuButton({
  children,
  isActive = false,
  onClick,
}: SidebarMenuButtonProps) {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <button
      onClick={onClick}
      title={collapsed && typeof children === "string" ? children : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-sm)",
        width: "100%",
        padding: collapsed ? "8px" : "8px var(--space-sm)",
        borderRadius: "var(--radius-md)",
        background: isActive ? "var(--color-surface-active)" : "transparent",
        color: isActive
          ? "var(--color-text-primary)"
          : "var(--color-text-secondary)",
        border: "1px solid",
        borderColor: isActive ? "var(--color-border-active)" : "transparent",
        cursor: "pointer",
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--font-weight-medium)",
        textAlign: "left",
        whiteSpace: "nowrap",
        justifyContent: collapsed ? "center" : "flex-start",
        transition: "all var(--transition-fast)",
      }}
      onMouseEnter={e => {
        if (!isActive)
          e.currentTarget.style.background = "var(--color-surface-hover)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = isActive
          ? "var(--color-surface-active)"
          : "transparent"
      }}
    >
      {children}
    </button>
  )
}

interface SidebarMenuActionProps {
  children: ReactNode
  onClick?: (e: React.MouseEvent) => void
}

export function SidebarMenuAction({
  children,
  onClick,
}: SidebarMenuActionProps) {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        right: 6,
        top: "50%",
        transform: "translateY(-50%)",
        display: collapsed ? "none" : "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        borderRadius: "var(--radius-xs)",
        border: "none",
        background: "transparent",
        color: "var(--color-text-tertiary)",
        cursor: "pointer",
        opacity: 0,
        transition: "all var(--transition-fast)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.opacity = "1"
        e.currentTarget.style.color = "var(--color-danger)"
        e.currentTarget.style.background = "var(--color-surface-hover)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.opacity = "0"
      }}
    >
      {children}
    </button>
  )
}

interface SidebarMenuBadgeProps {
  children: ReactNode
}

export function SidebarMenuBadge({ children }: SidebarMenuBadgeProps) {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  if (collapsed) return null

  return (
    <span
      style={{
        marginLeft: "auto",
        fontSize: "var(--font-size-xs)",
        fontWeight: "var(--font-weight-medium)",
        color: "var(--color-text-tertiary)",
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  )
}

export function SidebarTrigger({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === "collapsed"

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleSidebar()
  }

  if (children) {
    return (
      <button
        onClick={handleClick}
        style={{
          cursor: "pointer",
          background: "none",
          border: "none",
          padding: 0,
          ...(className ? { margin: "auto" } : {}),
        }}
      >
        {children}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      title="Toggle sidebar"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--color-border)",
        background: "transparent",
        color: "var(--color-text-secondary)",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
        ...(className ? { margin: "auto" } : {}),
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
      {collapsed ? (
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
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="15" y1="12" x2="3" y2="12" />
          <line x1="17" y1="18" x2="3" y2="18" />
        </svg>
      ) : (
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
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="15" y1="12" x2="3" y2="12" />
          <line x1="17" y1="18" x2="3" y2="18" />
          <rect x="15" y="5" width="6" height="14" rx="1" />
        </svg>
      )}
    </button>
  )
}

export function SidebarRail() {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      onClick={toggleSidebar}
      aria-label="Toggle sidebar"
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        right: -8,
        width: 8,
        zIndex: 20,
        border: "none",
        background: "transparent",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: "50%",
          width: 2,
          background: "transparent",
          transition: "background var(--transition-fast)",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "var(--color-accent)"
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "transparent"
        }}
      />
    </button>
  )
}
