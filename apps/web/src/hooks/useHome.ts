import { useState, useCallback, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchFeed,
  searchStories,
  toggleBookmark,
  fetchChats,
  fetchChatDetail,
  deleteChat,
} from "~web/lib/api-client.ts"
import { useSession, signOut } from "~web/lib/auth-client.ts"
import { useJobEvents } from "./useJobEvents.ts"

import type { StoryCardData } from "@weric/ui"
import type { ExpandableStory } from "~web/components/StoryDetailPanel.tsx"

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

const SELECTED_CHAT_KEY = "weric.selectedChatId"

function readSelectedChatId(): string | null {
  try {
    return window.localStorage.getItem(SELECTED_CHAT_KEY)
  } catch {
    return null
  }
}

export function useHome() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobCardDismissed, setJobCardDismissed] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    readSelectedChatId
  )
  const [activeSearchChatId, setActiveSearchChatId] = useState<string | null>(
    null
  )
  const [selectedStory, setSelectedStory] = useState<ExpandableStory | null>(
    null
  )

  useEffect(() => {
    try {
      if (selectedChatId) {
        window.localStorage.setItem(SELECTED_CHAT_KEY, selectedChatId)
      } else {
        window.localStorage.removeItem(SELECTED_CHAT_KEY)
      }
    } catch {}
  }, [selectedChatId])

  const feedQuery = useQuery({
    queryKey: ["feed"],
    queryFn: () => fetchFeed(),
  })

  const chatsQuery = useQuery({
    queryKey: ["chats"],
    queryFn: () => fetchChats(),
  })

  const chatDetailQuery = useQuery({
    queryKey: ["chat", selectedChatId],
    queryFn: () => fetchChatDetail(selectedChatId!),
    enabled: !!selectedChatId,
  })

  const searchMutation = useMutation({
    mutationFn: (q: string) => searchStories(q),
    onSuccess: data => {
      if (data.jobId) {
        setJobId(data.jobId)
      }
      if (data.chatId) {
        setSelectedChatId(data.chatId)
        setActiveSearchChatId(data.chatId)
        queryClient.invalidateQueries({ queryKey: ["chats"] })
      }
    },
  })

  const deleteChatMutation = useMutation({
    mutationFn: (id: string) => deleteChat(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] })
      setSelectedChatId(prev => (prev === id ? null : prev))
    },
  })

  const jobStatus = useJobEvents(jobId)

  useEffect(() => {
    if (jobStatus.status === "completed" && selectedChatId) {
      queryClient.invalidateQueries({ queryKey: ["chat", selectedChatId] })
      queryClient.invalidateQueries({ queryKey: ["chats"] })
    }
  }, [jobStatus.status, selectedChatId, queryClient])

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      setJobId(null)
      setJobCardDismissed(false)
      setSelectedStory(null)
      setActiveSearchChatId(null)
      searchMutation.mutate(query)
    },
    [searchMutation]
  )

  const handleSelectChat = useCallback((id: string) => {
    setSelectedChatId(id)
    setJobCardDismissed(true)
    setSelectedStory(null)
  }, [])

  useEffect(() => {
    if (selectedChatId && chatDetailQuery.isError) {
      setSelectedChatId(null)
    }
  }, [selectedChatId, chatDetailQuery.isError])

  const handleNewChat = useCallback(() => {
    setSelectedChatId(null)
    setActiveSearchChatId(null)
    setSearchQuery(null)
    setJobId(null)
    setSelectedStory(null)
  }, [])

  const handleDeleteChat = useCallback(
    (id: string) => {
      deleteChatMutation.mutate(id)
    },
    [deleteChatMutation]
  )

  const stories = useMemo(() => {
    const all: StoryCardData[] = []
    const seen = new Set<string>()

    const push = (s: StoryCardData) => {
      if (!seen.has(s.id)) {
        seen.add(s.id)
        all.push(s)
      }
    }

    const isActiveSearch = activeSearchChatId === selectedChatId

    if (selectedChatId) {
      for (const s of chatDetailQuery.data?.stories ?? []) push(s)
      if (isActiveSearch) {
        for (const s of searchMutation.data?.stories ?? []) push(s)
        for (const s of jobStatus.stories) {
          push({
            id: s.id,
            title: s.title,
            slug: s.slug,
            summary: s.summary || s.title,
            confidence: s.confidence,
            evidenceCount: 0,
            updatedAt: new Date().toISOString(),
          })
        }
      }
    } else {
      if (searchMutation.isSuccess && searchMutation.data?.stories.length) {
        for (const s of searchMutation.data.stories) push(s)
      } else {
        for (const s of feedQuery.data ?? []) push(s)
      }
      for (const s of jobStatus.stories) {
        push({
          id: s.id,
          title: s.title,
          slug: s.slug,
          summary: s.summary || s.title,
          confidence: s.confidence,
          evidenceCount: 0,
          updatedAt: new Date().toISOString(),
        })
      }
    }

    return layoutStories(all)
  }, [
    selectedChatId,
    activeSearchChatId,
    chatDetailQuery.data,
    searchMutation.data,
    searchMutation.isSuccess,
    jobStatus.stories,
    feedQuery.data,
  ])

  const loading =
    feedQuery.isLoading || chatDetailQuery.isLoading || searchMutation.isPending
  const error = feedQuery.error ?? chatDetailQuery.error ?? searchMutation.error
  const hasSearched = searchQuery !== null
  const showJobCard =
    jobId !== null &&
    !jobCardDismissed &&
    (jobStatus.active || jobStatus.status !== "idle")

  const handleExpand = useCallback((story: ExpandableStory) => {
    setSelectedStory(story)
    setJobCardDismissed(true)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedStory(null)
  }, [])

  const handleBookmark = useCallback(
    async (id: string) => {
      if (!session) {
        navigate("/login", { replace: true })
        return
      }
      try {
        await toggleBookmark(id)
        return true
      } catch {
        return false
      }
    },
    [session, navigate]
  )

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
    chats: chatsQuery.data ?? [],
    selectedChatId,
    handleSelectChat,
    handleNewChat,
    handleDeleteChat,
    selectedStory,
    handleCloseDetail,
  }
}
