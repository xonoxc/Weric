import type { StoryCardData } from "@weric/ui"

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api"
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true"

interface FeedItemRaw {
  story: {
    id: string
    title: string
    slug: string
    summary: string | null
    confidence: number
    status: string
    evidenceCount: number
    createdAt: string
    updatedAt: string
  }
  score: number
  reason?: string
}

interface FeedResponse {
  data: Array<{
    story: {
      id: string
      title: string
      slug: string
      summary: string | null
      confidence: number
      status: string
      evidenceCount: number
      createdAt: string
      updatedAt: string
    }
    score: number
    reason?: string
  }>
  meta: {
    page: number
    limit: number
    total: number
  }
}

interface SearchResponse {
  stories: Array<{
    id: string
    title: string
    slug: string
    summary: string | null
    confidence: number
    status: string
    evidenceCount: number
    createdAt: string
    updatedAt: string
  }>
  evidence: Array<{
    id: string
    storyId: string
    content: string
    source: string
    url: string | null
    publishedAt: string
    createdAt: string
  }>
  meta: {
    page: number
    limit: number
    storyTotal: number
    evidenceTotal: number
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API error ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

function mockStories(): StoryCardData[] {
  return [
    {
      id: "1",
      title: "LangGraph v2 Released with Native Streaming",
      summary:
        "The new version brings significant improvements to runtime performance, native streaming support, and checkpointing capabilities for production workloads.",
      confidence: 0.94,
      evidenceCount: 31,
      updatedAt: new Date(Date.now() - 23 * 60000).toISOString(),
      reason: "trending in AI",
    },
    {
      id: "2",
      title: "Model Context Protocol Gains Traction",
      summary:
        "MCP is seeing increased adoption across AI tooling ecosystems, with major players implementing support for the standardized context protocol.",
      confidence: 0.87,
      evidenceCount: 18,
      updatedAt: new Date(Date.now() - 47 * 60000).toISOString(),
      reason: "matches your interests",
    },
    {
      id: "3",
      title: "Rust 2026 Edition: What's Coming",
      summary:
        "The Rust team outlines plans for the next edition, focusing on async improvements, trait system enhancements, and better compile-time evaluation.",
      confidence: 0.91,
      evidenceCount: 24,
      updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      reason: "you follow Rust",
    },
    {
      id: "4",
      title: "Linux Kernel 7.0 Brings Major Scheduler Overhaul",
      summary:
        "The latest kernel release introduces a completely redesigned scheduler optimized for modern heterogeneous processor architectures and real-time workloads.",
      confidence: 0.96,
      evidenceCount: 42,
      updatedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
      reason: "high quality",
    },
    {
      id: "5",
      title: "TypeScript 6.0: Pattern Matching and Beyond",
      summary:
        "Microsoft's planned TypeScript 6.0 release includes first-class pattern matching, improved type narrowing, and faster compilation pipelines.",
      confidence: 0.83,
      evidenceCount: 15,
      updatedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      reason: "recent",
    },
    {
      id: "6",
      title: "WebAssembly GC Now Stable in Major Browsers",
      summary:
        "Garbage collection support for WebAssembly reaches stable status across Chrome, Firefox, and Safari, enabling efficient high-level language compilation.",
      confidence: 0.89,
      evidenceCount: 27,
      updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      reason: "recommended for you",
    },
    {
      id: "7",
      title: "PostgreSQL 19: Async I/O and Vector Search",
      summary:
        "The upcoming PostgreSQL release introduces asynchronous I/O for improved throughput, built-in vector similarity search, and enhanced partitioning.",
      confidence: 0.92,
      evidenceCount: 36,
      updatedAt: new Date(Date.now() - 15 * 3600000).toISOString(),
      reason: "matches your interests",
    },
    {
      id: "8",
      title: "Claude Code: AI-Assisted Development Reaches New Milestones",
      summary:
        "Anthropic's coding assistant demonstrates significant improvements in code generation accuracy, context understanding, and multi-file refactoring capabilities.",
      confidence: 0.78,
      evidenceCount: 22,
      updatedAt: new Date(Date.now() - 20 * 3600000).toISOString(),
      reason: "trending",
    },
  ]
}

export async function fetchFeed(
  _page = 1,
  _limit = 20
): Promise<StoryCardData[]> {
  if (USE_MOCK) return mockStories()
  const data = await request<FeedResponse>(
    `/feed?page=${_page}&limit=${_limit}`
  )
  return data.data.map(item => ({
    id: item.story.id,
    title: item.story.title,
    summary: item.story.summary ?? undefined,
    confidence: item.story.confidence,
    evidenceCount: item.story.evidenceCount,
    updatedAt: item.story.updatedAt,
    reason: item.reason,
  }))
}

export async function searchStories(query: string): Promise<StoryCardData[]> {
  if (USE_MOCK) {
    const q = query.toLowerCase()
    return mockStories().filter(
      s =>
        s.title.toLowerCase().includes(q) ||
        s.summary?.toLowerCase().includes(q)
    )
  }
  const data = await request<SearchResponse>(
    `/search?q=${encodeURIComponent(query)}`
  )
  return data.stories.map(s => ({
    id: s.id,
    title: s.title,
    summary: s.summary ?? undefined,
    confidence: s.confidence,
    evidenceCount: s.evidenceCount,
    updatedAt: s.updatedAt,
  }))
}

export async function createInteraction(storyId: string, type: string) {
  return request(`/interactions`, {
    method: "POST",
    body: JSON.stringify({ storyId, interactionType: type }),
  })
}

export async function toggleBookmark(storyId: string) {
  return request(`/bookmarks`, {
    method: "POST",
    body: JSON.stringify({ storyId }),
  })
}
