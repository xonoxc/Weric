import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import type { StoryCardData } from "@weric/ui"
import { fetchFeed, searchStories } from "../lib/api-client.ts"
import { useSession, signOut } from "../lib/auth-client.ts"
import { attempt } from "../lib/result.ts"

interface PositionedStory extends StoryCardData {
  x: number
  y: number
}

function layoutStories(stories: StoryCardData[]): PositionedStory[] {
  const spacing = 320
  const cols = Math.ceil(Math.sqrt(stories.length))
  return stories.map((story, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const offsetX =
      (col - (cols - 1) / 2) * spacing + (row % 2 === 0 ? 0 : spacing * 0.5)
    const offsetY = (row - (stories.length / cols - 1) / 2) * spacing
    return { ...story, x: offsetX, y: offsetY }
  })
}

export function useHome() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const [stories, setStories] = useState<PositionedStory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const loadFeed = useCallback(async () => {
    setLoading(true)
    setError(null)
    setHasSearched(false)

    const result = await attempt(() => fetchFeed())
    if (!result.ok) {
      setError(
        result.error instanceof Error
          ? result.error.message
          : "Failed to load feed"
      )
      setStories([])
    } else {
      setStories(layoutStories(result.data))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const handleSearch = useCallback(async (query: string) => {
    setLoading(true)
    setError(null)
    setHasSearched(true)

    const result = await attempt(() => searchStories(query))
    if (!result.ok) {
      setError(
        result.error instanceof Error ? result.error.message : "Search failed"
      )
      setStories([])
    } else {
      setStories(layoutStories(result.data))
    }
    setLoading(false)
  }, [])

  const handleExpand = useCallback((id: string) => {
    console.log(`Expand story ${id}`)
  }, [])

  const handleBookmark = useCallback((id: string) => {
    console.log(`Bookmark toggle ${id}`)
  }, [])

  const handleSignOut = useCallback(async () => {
    await signOut()
    navigate("/login", { replace: true })
  }, [navigate])

  const userName = session?.user?.name ?? session?.user?.email ?? "User"
  const userInitial = userName.charAt(0).toUpperCase()

  return {
    stories,
    loading,
    error,
    hasSearched,
    showUserMenu,
    setShowUserMenu,
    userName,
    userInitial,
    handleSearch,
    handleExpand,
    handleBookmark,
    handleSignOut,
  }
}
