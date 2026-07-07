import { useState } from "react"
import { useNavigate } from "react-router-dom"

export function useOnboarding() {
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

  return { selected, toggle, handleContinue }
}
