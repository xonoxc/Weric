import { useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation } from "@tanstack/react-query"
import type { StoryCardData } from "@weric/ui"
import { fetchFeed, searchStories } from "../lib/api-client.ts"
import { useSession, signOut } from "../lib/auth-client.ts"
import { useJobEvents } from "./useJobEvents.ts"

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
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobCardDismissed, setJobCardDismissed] = useState(false)

  const feedQuery = useQuery({
    queryKey: ["feed"],
    queryFn: () => fetchFeed(),
  })

  const searchMutation = useMutation({
    mutationFn: (q: string) => searchStories(q),
    onSuccess: data => {
      if (data.jobId) {
        setJobId(data.jobId)
      }
    },
  })

  const jobStatus = useJobEvents(jobId)

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      setJobId(null)
      setJobCardDismissed(false)
      searchMutation.mutate(query)
    },
    [searchMutation]
  )

  const stories = useMemo(() => {
    const all: StoryCardData[] = []

    if (searchMutation.isSuccess && searchMutation.data) {
      all.push(...searchMutation.data.stories)
    } else {
      all.push(...(feedQuery.data ?? []))
    }

    const existingIds = new Set(all.map(s => s.id))
    for (const s of jobStatus.stories) {
      if (!existingIds.has(s.id)) {
        all.push({
          id: s.id,
          title: s.title,
          summary: s.summary || s.title,
          confidence: s.confidence,
          evidenceCount: 0,
          updatedAt: new Date().toISOString(),
        })
        existingIds.add(s.id)
      }
    }

    return layoutStories(all)
  }, [searchMutation.data, feedQuery.data, jobStatus.stories])

  const loading = feedQuery.isLoading || searchMutation.isPending
  const error = feedQuery.error ?? searchMutation.error
  const hasSearched = searchQuery !== null
  const showJobCard =
    jobId !== null &&
    !jobCardDismissed &&
    (jobStatus.active || jobStatus.stories.length > 0)

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

  const handleDismissJobCard = useCallback(() => {
    setJobCardDismissed(true)
  }, [])

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
    jobStatus,
    showJobCard,
    handleDismissJobCard,
  }
}
