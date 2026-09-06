import { Effect, Option } from "effect"
import { ChatRepository } from "@weric/database"

import type { Optioned } from "@weric/utils"
import type { RepositoryError } from "@weric/database"
import type { ChatListRow, ChatDetail } from "@weric/database"
import type { DBChat as DBChatRow } from "~db/schema/tables.ts"

export interface ChatServiceShape {
  readonly findByUser: (
    userId: string
  ) => Effect.Effect<ChatListRow[], RepositoryError>

  readonly create: (data: {
    title: string
    query: Optioned<string>
    userId: Optioned<string>
  }) => Effect.Effect<DBChatRow, RepositoryError>

  readonly findById: (
    id: string
  ) => Effect.Effect<Optioned<DBChatRow>, RepositoryError>

  readonly findByIdWithStories: (
    id: string
  ) => Effect.Effect<Optioned<ChatDetail>, RepositoryError>

  readonly delete: (id: string) => Effect.Effect<void, RepositoryError>
}

export class ChatService extends Effect.Service<ChatServiceShape>()(
  "ChatService",
  {
    effect: Effect.gen(function* () {
      const repo = yield* ChatRepository

      return {
        findByUser: userId => repo.findByUser(userId, Option.none()),

        create: data => repo.create(data),

        findById: id => repo.findById(id),

        findByIdWithStories: id => repo.findByIdWithStories(id),

        delete: id => repo.delete(id),
      } satisfies ChatServiceShape
    }),
  }
) {}

export const ChatServiceLive = ChatService.Default
