import { useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { signIn, useSession } from "../lib/auth-client.ts"

const pageStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--color-bg)",
  padding: 24,
}

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 360,
  display: "flex",
  flexDirection: "column",
  gap: 24,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  color: "var(--color-text-primary)",
  fontSize: 15,
  outline: "none",
  transition: "border-color var(--transition-fast)",
  boxSizing: "border-box",
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "var(--color-text-secondary)",
  marginBottom: 6,
  display: "block",
}

const btnPrimary: React.CSSProperties = {
  width: "100%",
  height: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--color-accent)",
  color: "white",
  fontSize: 15,
  fontWeight: 500,
  borderRadius: "var(--radius-md)",
  border: "none",
  cursor: "pointer",
  transition: "opacity var(--transition-fast)",
}

const btnDisabled: React.CSSProperties = {
  ...btnPrimary,
  opacity: 0.4,
  cursor: "not-allowed",
}

const dividerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  color: "var(--color-text-tertiary)",
  fontSize: 12,
}

const dividerLine: React.CSSProperties = {
  flex: 1,
  height: 1,
  background: "var(--color-border)",
}

const socialBtn: React.CSSProperties = {
  width: "100%",
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  color: "var(--color-text-secondary)",
  fontSize: 14,
  cursor: "pointer",
  transition: "all var(--transition-fast)",
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { data: session, isPending: sessionLoading } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (sessionLoading) return null
  if (session) return <Navigate to="/" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await signIn.email({ email, password })
      if (result.error) {
        setError(
          result.error.message ??
            result.error.statusText ??
            "Invalid credentials"
        )
        return
      }
      navigate("/", { replace: true })
    } catch {
      setError("Connection failed. Check that the API server is running.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.03em",
              marginBottom: 8,
            }}
          >
            WERIC
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>
            Defragment the Internet.
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              onFocus={e => {
                e.currentTarget.style.borderColor = "var(--color-border-hover)"
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = "var(--color-border)"
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              onFocus={e => {
                e.currentTarget.style.borderColor = "var(--color-border-hover)"
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = "var(--color-border)"
              }}
            />
          </div>

          {error && (
            <div
              style={{
                fontSize: 13,
                color: "var(--color-danger)",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={loading || !email || !password ? btnDisabled : btnPrimary}
            onMouseEnter={e => {
              if (!loading && email && password)
                e.currentTarget.style.opacity = "0.85"
            }}
            onMouseLeave={e => {
              if (!loading) e.currentTarget.style.opacity = "1"
            }}
          >
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>

        <div style={dividerStyle}>
          <div style={dividerLine} />
          <span>or continue with</span>
          <div style={dividerLine} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            style={socialBtn}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--color-border-hover)"
              e.currentTarget.style.color = "var(--color-text-primary)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--color-border)"
              e.currentTarget.style.color = "var(--color-text-secondary)"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>
          <button
            style={socialBtn}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--color-border-hover)"
              e.currentTarget.style.color = "var(--color-text-primary)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--color-border)"
              e.currentTarget.style.color = "var(--color-text-secondary)"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--color-text-tertiary)",
          }}
        >
          <Link
            to="/signup"
            style={{ color: "var(--color-accent)", textDecoration: "none" }}
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  )
}
