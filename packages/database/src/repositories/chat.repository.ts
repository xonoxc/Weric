import { Effect } from "effect"
import { desc, eq, sql } from "drizzle-orm"
import {
  chats,
  chatStories,
  stories,
  storyEvidence,
} from "~db/schema/tables.ts"
import { NotFoundError, tryDb } from "./errors.ts"

import { Database } from "~db/connection.ts"
import type { RepositoryError } from "./errors.ts"
import type { StoryWithEvidenceCount } from "./story.repository.ts"

const TSFMT = 'YYYY-MM-DD"T"HH24:MI:SS"Z"'

export interface ChatListRow {
  id: string
  title: string
  query: string | null
  storyCount: number
  createdAt: Date
  updatedAt: Date
}

export interface ChatDetail {
  id: string
  title: string
  query: string | null
  createdAt: Date
  updatedAt: Date
  stories: StoryWithEvidenceCount[]
}

export interface ChatRepositoryShape {
  readonly create: (data: {
    title: string
    query?: string | null
    userId?: string | null
  }) => Effect.Effect<typeof chats.$inferSelect, RepositoryError>

  readonly findById: (
    id: string
  ) => Effect.Effect<typeof chats.$inferSelect | null, RepositoryError>

  readonly findByUser: (
    userId: string,
    options?: { limit?: number }
  ) => Effect.Effect<ChatListRow[], RepositoryError>

  readonly countDistinctStoriesByUser: (
    userId: string
  ) => Effect.Effect<number, RepositoryError>

  readonly findByIdWithStories: (
    id: string
  ) => Effect.Effect<ChatDetail | null, RepositoryError>

  readonly addStory: (
    chatId: string,
    storyId: string
  ) => Effect.Effect<void, RepositoryError>

  readonly touch: (id: string) => Effect.Effect<void, RepositoryError>

  readonly delete: (id: string) => Effect.Effect<void, RepositoryError>
}

export class ChatRepository extends Effect.Service<ChatRepositoryShape>()(
  "ChatRepository",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database

      return {
        create: data => {
          return tryDb(async () => {
            const [row] = await db
              .insert(chats)
              .values({
                title: data.title,
                query: data.query ?? null,
                userId: data.userId ?? null,
              })
              .returning()
            return row!
          })
        },

        findById: id => {
          return tryDb(async () => {
            const [row] = await db
              .select()
              .from(chats)
              .where(eq(chats.id, id))
              .limit(1)
            return row ?? null
          })
        },

        findByUser: (userId, options = {}) => {
          return tryDb(async () => {
            const limit = Math.min(options.limit ?? 100, 200)

            const rows = await db
              .select({
                id: chats.id,
                title: chats.title,
                query: chats.query,
                createdAt: chats.createdAt,
                updatedAt: chats.updatedAt,
                storyCount: sql<number>`(
                SELECT count(*)::int FROM ${chatStories}
                WHERE ${chatStories.chatId} = ${chats.id}
              )`,
              })
              .from(chats)
              .where(eq(chats.userId, userId))
              .orderBy(desc(chats.updatedAt))
              .limit(limit)
            return rows as ChatListRow[]
          })
        },

        countDistinctStoriesByUser: userId => {
          return tryDb(async () => {
            const [row] = await db
              .select({
                count: sql<number>`count(DISTINCT ${chatStories.storyId})::int`,
              })
              .from(chatStories)
              .innerJoin(chats, eq(chatStories.chatId, chats.id))
              .where(eq(chats.userId, userId))
            return row?.count ?? 0
          })
        },

        findByIdWithStories: id => {
          return tryDb(async () => {
            const [chat] = await db
              .select()
              .from(chats)
              .where(eq(chats.id, id))
              .limit(1)
            if (!chat) return null

            const rows = await db
              .select({
                id: stories.id,
                title: stories.title,
                slug: stories.slug,
                summary: sql<string>`COALESCE(${stories.summary}, '')`,
                confidence: sql<number>`COALESCE(${stories.confidence}, 0)`,
                status: stories.status,
                createdAt: sql<string>`to_char(${stories.createdAt}, ${TSFMT})`,
                updatedAt: sql<string>`to_char(${stories.updatedAt}, ${TSFMT})`,
                evidenceCount: sql<number>`(
                SELECT count(*)::int FROM ${storyEvidence}
                WHERE ${storyEvidence.storyId} = ${stories.id}
              )`,
              })
              .from(chatStories)
              .innerJoin(stories, eq(chatStories.storyId, stories.id))
              .where(eq(chatStories.chatId, id))
              .orderBy(desc(stories.createdAt))

            return {
              id: chat.id,
              title: chat.title,
              query: chat.query,
              createdAt: chat.createdAt,
              updatedAt: chat.updatedAt,
              stories: rows as StoryWithEvidenceCount[],
            }
          })
        },

        addStory: (chatId, storyId) => {
          return tryDb(() =>
            db
              .insert(chatStories)
              .values({ chatId, storyId })
              .onConflictDoNothing()
          )
        },

        touch: id => {
          return tryDb(() =>
            db
              .update(chats)
              .set({ updatedAt: new Date() })
              .where(eq(chats.id, id))
          )
        },

        delete: id => {
          return tryDb(async () => {
            const [existing] = await db
              .select()
              .from(chats)
              .where(eq(chats.id, id))
              .limit(1)
            if (!existing) throw new NotFoundError("Chat", id)
            await db.delete(chats).where(eq(chats.id, id))
          })
        },
      } satisfies ChatRepositoryShape
    }),
  }
) {}

export const ChatRepositoryLive = ChatRepository.Default
