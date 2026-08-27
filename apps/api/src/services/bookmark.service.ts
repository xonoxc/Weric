import { Context, Effect, Layer } from "effect"
import { BookmarkRepository } from "@weric/database"
import { bookmarks } from "~db/schema/tables.ts"

import type { RepositoryError } from "@weric/database"
import type { BookmarkWithStory } from "@weric/database"

type BookmarkRow = (typeof bookmarks)["$inferSelect"]

export interface BookmarkServiceShape {
  readonly listByUser: (
    userId: string
  ) => Effect.Effect<BookmarkWithStory[], RepositoryError>

  readonly create: (
    userId: string,
    storyId: string
  ) => Effect.Effect<BookmarkRow, RepositoryError>

  readonly remove: (
    userId: string,
    storyId: string
  ) => Effect.Effect<void, RepositoryError>
}

export class BookmarkService extends Context.Tag("BookmarkService")<
  BookmarkService,
  BookmarkServiceShape
>() {}

export const BookmarkServiceLive = Layer.effect(
  BookmarkService,
  Effect.gen(function* () {
    const repo = yield* BookmarkRepository

    return {
      listByUser: userId => repo.findByUserWithStories(userId),
      create: (userId, storyId) => repo.create(userId, storyId),
      remove: (userId, storyId) => repo.delete(userId, storyId),
    }
  })
)
