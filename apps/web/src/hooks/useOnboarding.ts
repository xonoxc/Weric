import { useState } from "react"
import { useNavigate } from "react-router-dom"

export function useOnboarding() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const toggle = (topic: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(topic)) next.delete(topic)
      else next.add(topic)
      return next
    })
  }

  const handleContinue = async () => {
    if (selected.size > 0) {
      setSaving(true)
      try {
        await fetch("/api/interests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topics: [...selected] }),
        })
      } catch {
        // Silently fail - interests are non-critical
      } finally {
        setSaving(false)
      }
    }
    navigate("/", { replace: true })
  }

  return { selected, toggle, handleContinue, saving }
}
