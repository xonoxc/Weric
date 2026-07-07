import { Link, Navigate } from "react-router-dom"
import { useSignup } from "../hooks/useSignup.ts"

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

export default function SignupPage() {
  const {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    session,
    sessionLoading,
    handleSubmit,
  } = useSignup()

  if (sessionLoading) return null
  if (session) return <Navigate to="/onboarding" replace />

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
          <div
            style={{
              fontSize: 15,
              color: "var(--color-text-primary)",
              fontWeight: 500,
            }}
          >
            Create your account
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <label style={labelStyle}>Name</label>
            <input
              style={inputStyle}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
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
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              minLength={8}
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
            disabled={loading || !name || !email || !password}
            style={
              loading || !name || !email || !password ? btnDisabled : btnPrimary
            }
            onMouseEnter={e => {
              if (!loading && name && email && password)
                e.currentTarget.style.opacity = "0.85"
            }}
            onMouseLeave={e => {
              if (!loading) e.currentTarget.style.opacity = "1"
            }}
          >
            {loading ? "Creating account..." : "Continue"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--color-text-tertiary)",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "var(--color-accent)", textDecoration: "none" }}
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
