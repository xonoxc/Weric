import { IconLogout, IconSettings, IconUser } from "@tabler/icons-react"
import { useNavigate } from "react-router-dom"

interface UserMenuItem {
  label: string
  icon: "user" | "settings" | "logout"
  onClick: () => void
}

interface UserMenuProps {
  userName: string
  userInitial: string
  userImage?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSignOut: () => void
}

export function UserMenu({
  userName,
  userInitial,
  userImage,
  open,
  onOpenChange,
  onSignOut,
}: UserMenuProps) {
  const navigate = useNavigate()

  const menuItems: (UserMenuItem | { divider: true })[] = [
    { label: "Profile", icon: "user", onClick: () => navigate("/profile") },
    { label: "Settings", icon: "settings", onClick: () => onOpenChange(false) },
    { divider: true },
    { label: "Sign out", icon: "logout", onClick: onSignOut },
  ]

  const iconFor = (icon: UserMenuItem["icon"]) => {
    switch (icon) {
      case "user":
        return <IconUser className="h-3.5 w-3.5" />
      case "settings":
        return <IconSettings className="h-3.5 w-3.5" />
      case "logout":
        return <IconLogout className="h-3.5 w-3.5" />
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = "var(--color-border-hover)"
          e.currentTarget.style.background = "var(--color-surface-hover)"
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = "var(--color-border)"
          e.currentTarget.style.background = "var(--color-surface)"
        }}
        title={userName}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px] border border-[var(--color-border)] text-[13px] font-semibold p-0"
        style={{
          color: "var(--color-text-secondary)",
          cursor: "pointer",
          background: "var(--color-surface)",
          transition: "all var(--transition-fast)",
        }}
      >
        {userImage ? (
          <img
            src={userImage}
            alt={userName}
            className="h-full w-full object-cover"
          />
        ) : (
          userInitial
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0"
            style={{ zIndex: 49 }}
            onClick={() => onOpenChange(false)}
          />
          <div
            className="absolute top-full right-0 mt-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] p-1"
            style={{
              minWidth: 180,
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-lg)",
              zIndex: 50,
            }}
          >
            <div
              className="mb-1 border-b border-[var(--color-border)] px-3 py-2 text-[13px]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {userName}
            </div>
            {menuItems.map((item, i) => {
              if ("divider" in item) {
                return (
                  <div
                    key={`divider-${i}`}
                    className="my-1 h-px"
                    style={{ background: "var(--color-border)" }}
                  />
                )
              }
              const danger = item.label === "Sign out"
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className="flex w-full items-center gap-2 rounded-[var(--radius-xs)] border-none px-3 py-2 text-left text-[13px]"
                  style={{
                    color: danger
                      ? "var(--color-danger)"
                      : "var(--color-text-secondary)",
                    background: "transparent",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background =
                      "var(--color-surface-hover)"
                    e.currentTarget.style.color = "var(--color-text-primary)"
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.color = danger
                      ? "var(--color-danger)"
                      : "var(--color-text-secondary)"
                  }}
                >
                  {iconFor(item.icon)}
                  {item.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
