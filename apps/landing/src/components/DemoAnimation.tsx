import React, { useEffect, useRef, useState } from "react"

const steps = [
  { text: "Explain the Model Context Protocol", delay: 0 },
  { text: "", delay: 1200, action: "think" as const },
  { text: "", delay: 1800, action: "stories" as const },
  { text: "", delay: 3200, action: "connect" as const },
  { text: "", delay: 4800, action: "complete" as const },
]

const stories = [
  { title: "MCP: An Anthropic Perspective", sources: 12, confidence: 92 },
  { title: "OpenAI Implements MCP Support", sources: 8, confidence: 85 },
  { title: "Community MCP Implementations", sources: 15, confidence: 78 },
]

export default function DemoAnimation() {
  const [step, setStep] = useState(0)
  const [showStories, setShowStories] = useState<string[]>([])
  const [connected, setConnected] = useState(false)
  const [dots, setDots] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    steps.forEach((s, i) => {
      timers.push(
        setTimeout(() => {
          setStep(i + 1)
          if (s.action === "stories") {
            setShowStories(["s1", "s2", "s3"])
          }
          if (s.action === "connect") {
            setTimeout(() => setConnected(true), 600)
          }
        }, s.delay)
      )
    })

    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (step >= 2 && step < 5) {
      const interval = setInterval(() => {
        setDots(prev => (prev.length >= 3 ? "" : prev + "."))
      }, 400)
      return () => clearInterval(interval)
    }
  }, [step])

  useEffect(() => {
    const cycle = setTimeout(() => {
      setStep(0)
      setShowStories([])
      setConnected(false)
    }, 6000)
    return () => clearTimeout(cycle)
  }, [step])

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl border border-border bg-surface overflow-hidden"
      style={{ minHeight: 420 }}
    >
      {/* Command bar */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-secondary border border-border shadow-lg">
          <svg
            className="w-4 h-4 text-text-tertiary shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span
            className={`flex-1 text-sm ${step >= 1 ? "text-text-primary" : "text-text-tertiary"}`}
          >
            {step >= 1
              ? "Explain Model Context Protocol"
              : "Ask Weric anything..."}
          </span>
          <span className="text-xs text-text-tertiary flex items-center gap-1">
            {step >= 2 && step <= 4 && (
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Analyzing{dots}
              </span>
            )}
            {step >= 5 && <span className="text-accent">Complete</span>}
          </span>
        </div>
      </div>

      {/* Story cards */}
      <div className="absolute inset-0 p-6">
        {showStories.map((id, i) => (
          <div
            key={id}
            className="absolute p-4 rounded-lg bg-bg-secondary border border-border shadow-md transition-all duration-700"
            style={{
              width: 220,
              left: 40 + i * 80,
              top: connected ? 40 : 60 + i * 30,
              opacity: 1,
              transform: connected
                ? "translateY(0)"
                : `translateY(${(i + 1) * 20}px)`,
              transitionDelay: `${i * 150}ms`,
            }}
          >
            <div className="text-xs font-medium text-text-primary">
              {stories[i].title}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
              <span>{stories[i].sources} sources</span>
              <span
                className={
                  stories[i].confidence >= 85
                    ? "text-accent"
                    : "text-text-tertiary"
                }
              >
                {stories[i].confidence}%
              </span>
            </div>
            {connected && (
              <div className="mt-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                  Connected
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Connection lines */}
        {connected && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: 0.3 }}
          >
            <line
              x1="150"
              y1="120"
              x2="230"
              y2="100"
              stroke="var(--color-accent)"
              strokeWidth="1"
            />
            <line
              x1="230"
              y1="100"
              x2="310"
              y2="80"
              stroke="var(--color-accent)"
              strokeWidth="1"
            />
          </svg>
        )}
      </div>

      {/* Step indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map(s => (
          <div
            key={s}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              step >= s ? "bg-accent" : "bg-bg-tertiary"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
