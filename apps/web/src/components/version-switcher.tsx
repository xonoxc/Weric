import { useState } from "react"

interface VersionSwitcherProps {
  versions: string[]
  defaultVersion?: string
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-xs)",
  padding: "0 var(--space-sm)",
}

const selectStyle: React.CSSProperties = {
  flex: 1,
  padding: "6px var(--space-sm)",
  borderRadius: "var(--radius-md)",
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text-primary)",
  fontSize: "var(--font-size-sm)",
  fontWeight: "var(--font-weight-medium)",
  cursor: "pointer",
}

export function VersionSwitcher({
  versions,
  defaultVersion,
}: VersionSwitcherProps) {
  const [selectedVersion, setSelectedVersion] = useState(
    defaultVersion ?? versions[0] ?? ""
  )

  return (
    <div style={containerStyle}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }}
      >
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
      </svg>
      <select
        aria-label="Select version"
        value={selectedVersion}
        onChange={e => setSelectedVersion(e.target.value)}
        style={selectStyle}
      >
        {versions.map(version => (
          <option key={version} value={version}>
            {version}
          </option>
        ))}
      </select>
    </div>
  )
}
