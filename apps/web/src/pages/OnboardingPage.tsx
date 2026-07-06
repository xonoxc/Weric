import { useState } from "react"
import { useNavigate } from "react-router-dom"

const categories = [
  "AI",
  "Programming",
  "Startups",
  "Design",
  "Science",
  "Space",
  "Mathematics",
  "Linux",
  "Open Source",
  "Cybersecurity",
  "Databases",
  "Web Development",
  "Systems Programming",
  "Rust",
  "Go",
  "TypeScript",
  "Cloud",
  "DevOps",
]

const pageStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--color-bg)",
  padding: 24,
  overflow: "auto",
}

const containerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 640,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 32,
}

const cardBase: React.CSSProperties = {
  padding: "16px 24px",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-secondary)",
  fontSize: 15,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all var(--transition-base)",
  userSelect: "none",
  textAlign: "center",
}

const cardSelected: React.CSSProperties = {
  ...cardBase,
  borderColor: "var(--color-accent)",
  background: "var(--color-accent-muted)",
  color: "var(--color-accent)",
}

const btnPrimary: React.CSSProperties = {
  padding: "12px 32px",
  display: "inline-flex",
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
  opacity: 0.3,
  cursor: "not-allowed",
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (topic: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(topic)) next.delete(topic)
      else next.add(topic)
      return next
    })
  }

  const handleContinue = () => {
    navigate("/", { replace: true })
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.03em",
              marginBottom: 12,
            }}
          >
            Welcome to Weric
          </div>
          <div
            style={{
              fontSize: 15,
              color: "var(--color-text-secondary)",
              lineHeight: 1.6,
            }}
          >
            Let's build your personalized internet.
            <br />
            Select topics that interest you.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
            maxWidth: 520,
          }}
        >
          {categories.map(topic => {
            const isSelected = selected.has(topic)
            return (
              <div
                key={topic}
                style={isSelected ? cardSelected : cardBase}
                onClick={() => toggle(topic)}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor =
                      "var(--color-border-hover)"
                    e.currentTarget.style.background =
                      "var(--color-surface-hover)"
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = "var(--color-border)"
                    e.currentTarget.style.background = "var(--color-surface)"
                  }
                }}
              >
                {topic}
              </div>
            )
          })}
        </div>

        <button
          disabled={selected.size === 0}
          style={selected.size === 0 ? btnDisabled : btnPrimary}
          onClick={handleContinue}
          onMouseEnter={e => {
            if (selected.size > 0) e.currentTarget.style.opacity = "0.85"
          }}
          onMouseLeave={e => {
            if (selected.size > 0) e.currentTarget.style.opacity = "1"
          }}
        >
          {selected.size === 0
            ? "Select topics to continue"
            : `Continue${selected.size > 0 ? ` (${selected.size})` : ""}`}
        </button>
      </div>
    </div>
  )
}
