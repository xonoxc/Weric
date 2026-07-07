import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation } from "@tanstack/react-query"
import type { StoryCardData } from "@weric/ui"
import { fetchFeed, searchStories } from "../lib/api-client.ts"
import { useSession, signOut } from "../lib/auth-client.ts"

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
  const [searchQuery, setSearchQuery] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const feedQuery = useQuery({
    queryKey: ["feed"],
    queryFn: () => fetchFeed(),
  })

  const searchMutation = useMutation({
    mutationFn: (q: string) => searchStories(q),
  })

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      searchMutation.mutate(query)
    },
    [searchMutation]
  )

  const stories =
    searchMutation.isSuccess && searchMutation.data
      ? layoutStories(searchMutation.data)
      : layoutStories(feedQuery.data ?? [])
  const loading = feedQuery.isLoading || searchMutation.isPending
  const error = feedQuery.error ?? searchMutation.error
  const hasSearched = searchQuery !== null

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
  const userImage = session?.user?.image ?? null

  return {
    stories,
    loading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Something went wrong"
      : null,
    hasSearched,
    showUserMenu,
    setShowUserMenu,
    userName,
    userInitial,
    userImage,
    handleSearch,
    handleExpand,
    handleBookmark,
    handleSignOut,
  }
}
