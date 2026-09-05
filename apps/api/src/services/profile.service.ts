import { Effect } from "effect"
import {
  BookmarkRepository,
  ChatRepository,
  InterestRepository,
  InteractionRepository,
} from "@weric/database"

import type { AuthUser } from "@weric/auth"
import type { RepositoryError } from "@weric/database"

export interface ProfileData {
  user: AuthUser
  stats: {
    chats: number
    stories: number
    bookmarks: number
    interests: number
    interactions: number
    interactionsByType: import("@weric/database").InteractionAggregate[]
  }
  interests: import("@weric/database").InterestRow[]
  bookmarks: import("@weric/database").BookmarkWithStory[]
  recentChats: import("@weric/database").ChatListRow[]
  activity: import("@weric/database").InteractionWithStory[]
}

export interface ProfileServiceShape {
  readonly getProfile: (
    user: AuthUser
  ) => Effect.Effect<ProfileData, RepositoryError>
}

export class ProfileService extends Effect.Service<ProfileServiceShape>()(
  "ProfileService",
  {
    effect: Effect.gen(function* () {
      const bookmarkRepo = yield* BookmarkRepository
      const chatRepo = yield* ChatRepository
      const interestRepo = yield* InterestRepository
      const interactionRepo = yield* InteractionRepository

      return {
        getProfile: user =>
          Effect.gen(function* () {
            const [
              chats,
              stories,
              interests,
              bookmarks,
              interactionAggregates,
              activity,
            ] = yield* Effect.all(
              [
                chatRepo.findByUser(user.id),
                chatRepo.countDistinctStoriesByUser(user.id),
                interestRepo.findByUserId(user.id),
                bookmarkRepo.findByUserWithStories(user.id),
                interactionRepo.aggregateByType(user.id),
                interactionRepo.findRecentWithStories(user.id, 12),
              ],
              { concurrency: "unbounded" }
            )

            const interactionTotal = interactionAggregates.reduce(
              (sum, row) => sum + row.count,
              0
            )

            return {
              user,
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
            }
          }),
      } satisfies ProfileServiceShape
    }),
  }
) {}

export const ProfileServiceLive = ProfileService.Default
