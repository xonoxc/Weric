import { type ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useSession } from "../lib/auth-client.ts"

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true"

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, isPending } = useSession()

  if (USE_MOCK) {
    return <>{children}</>
  }

  if (isPending) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "var(--color-bg)",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "var(--color-text-primary)",
            letterSpacing: "-0.03em",
          }}
        >
          Weric
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[0, 0.2, 0.4].map(delay => (
            <div
              key={delay}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--color-accent)",
                animation: "pulse 1.4s infinite ease-in-out",
                animationDelay: `${delay}s`,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
