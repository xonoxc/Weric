import { Hono } from "hono"
import { Effect } from "effect"
import {
  BookmarkRepository,
  ChatRepository,
  InterestRepository,
  InterestRepositoryLive,
  InteractionRepository,
  InteractionRepositoryLive,
} from "@weric/database"
import { serviceFromLayer } from "~api/lib/layers.ts"
import { requireUser } from "~api/lib/validation.ts"

import type { Db } from "@weric/database"
import type { ApiVariables } from "~api/app.ts"

export function createProfileRoutes(db: Db) {
  const router = new Hono<{ Variables: ApiVariables }>()
  const bookmarkRepo = new BookmarkRepository(db)
  const chatRepo = new ChatRepository(db)
  const interestRepo = serviceFromLayer(
    InterestRepository,
    InterestRepositoryLive(db)
  )
  const interactionRepo = serviceFromLayer(
    InteractionRepository,
    InteractionRepositoryLive(db)
  )

  router.get("/", async c => {
    const user = requireUser(c)

    const [
      chats,
      stories,
      interests,
      bookmarks,
      interactionAggregates,
      activity,
    ] = await Promise.all([
      Effect.runPromise(chatRepo.findByUser(user.id)),
      Effect.runPromise(chatRepo.countDistinctStoriesByUser(user.id)),
      Effect.runPromise(interestRepo.findByUserId(user.id)),
      Effect.runPromise(bookmarkRepo.findByUserWithStories(user.id)),
      Effect.runPromise(interactionRepo.aggregateByType(user.id)),
      Effect.runPromise(interactionRepo.findRecentWithStories(user.id, 12)),
    ])

    const interactionTotal = interactionAggregates.reduce(
      (sum, row) => sum + row.count,
      0
    )

    return c.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username ?? null,
        displayUsername: user.displayUsername ?? null,
        image: user.image ?? null,
        createdAt: user.createdAt,
      },
      stats: {
        chats: chats.length,
        stories,
        bookmarks: bookmarks.length,
        interests: interests.length,
        interactions: interactionTotal,
        interactionsByType: interactionAggregates,
      },
      interests,
      bookmarks,
      recentChats: chats.slice(0, 8),
      activity,
    })
  })

  return router
}
