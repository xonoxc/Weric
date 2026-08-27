import { Context, Effect, Layer } from "effect"
import { ChatRepository } from "@weric/database"
import { chats } from "~db/schema/tables.ts"

import type { RepositoryError } from "@weric/database"
import type { ChatListRow, ChatDetail } from "@weric/database"

type ChatRow = (typeof chats)["$inferSelect"]

export interface ChatServiceShape {
  readonly findByUser: (
    userId: string
  ) => Effect.Effect<ChatListRow[], RepositoryError>

  readonly create: (data: {
    title: string
    query?: string | null
    userId?: string | null
  }) => Effect.Effect<ChatRow, RepositoryError>

  readonly findById: (
    id: string
  ) => Effect.Effect<ChatRow | null, RepositoryError>

  readonly findByIdWithStories: (
    id: string
  ) => Effect.Effect<ChatDetail | null, RepositoryError>

  readonly delete: (id: string) => Effect.Effect<void, RepositoryError>
}

export class ChatService extends Context.Tag("ChatService")<
  ChatService,
  ChatServiceShape
>() {}

export const ChatServiceLive = Layer.effect(
  ChatService,
  Effect.gen(function* () {
    const repo = yield* ChatRepository

    return {
      findByUser: userId => repo.findByUser(userId),
      create: data => repo.create(data),
      findById: id => repo.findById(id),
      findByIdWithStories: id => repo.findByIdWithStories(id),
      delete: id => repo.delete(id),
    }
  })
)
