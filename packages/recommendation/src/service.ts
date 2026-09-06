import { Effect, Option } from "effect"
import { StoryScorer } from "./scorer.ts"
import { FeedRanker } from "./ranker.ts"
import { InterestLearner } from "./interest.ts"
import { NoStoriesError, ScoringError } from "./errors.ts"

import {
  StoryRepository,
  InterestRepository,
  InteractionRepository,
} from "@weric/database"

import type { StoryWithEvidenceCount } from "@weric/database"
import type { Optioned } from "@weric/utils"

import type { Feed } from "@weric/contracts"
import type { RecommendationError } from "./errors.ts"

export interface FeedOptions {
  page: Optioned<number>
  limit: Optioned<number>
}

const DEFAULT_FEED_OPTIONS: FeedOptions = {
  page: Option.none(),
  limit: Option.none(),
}

export interface RecommendationServiceShape {
  readonly generateFeed: (
    userId: string,
    options?: FeedOptions
  ) => Effect.Effect<Feed, RecommendationError>

  readonly scoreStory: (
    storyId: string,
    userId: string
  ) => Effect.Effect<number, RecommendationError>

  readonly updateInterests: (
    userId: string,
    storyId: string,
    interactionType: string
  ) => Effect.Effect<void, RecommendationError>
}

const toScoringError =
  (message: string) =>
  (cause: unknown): ScoringError =>
    new ScoringError({ message, cause })

export class RecommendationService extends Effect.Service<RecommendationServiceShape>()(
  "RecommendationService",
  {
    effect: Effect.gen(function* () {
      const storyRepo = yield* StoryRepository
      const interestRepo = yield* InterestRepository
      const interactionRepo = yield* InteractionRepository
      const interestLearner = yield* InterestLearner

      const scorer = yield* StoryScorer
      const ranker = yield* FeedRanker

      const generateFeed = (
        userId: string,
        options: FeedOptions = DEFAULT_FEED_OPTIONS
      ): Effect.Effect<Feed, RecommendationError> => {
        const page = Option.getOrElse(options.page, () => 1)
        const limit = Math.min(
          Option.getOrElse(options.limit, () => 50),
          100
        )

        return Effect.gen(function* () {
          const { data: stories, total } = yield* storyRepo
            .findPublishedFeed(
              Option.some({
                page: Option.some(1),
                limit: Option.some(100),
              })
            )
            .pipe(
              Effect.mapError(
                toScoringError("Failed to fetch published stories")
              )
            )

          if (stories.length === 0) {
            return {
              data: [],
              meta: {
                page,
                limit,
                total: 0,
              },
            } satisfies Feed
          }

          const interests = yield* interestRepo
            .findByUserId(userId)
            .pipe(
              Effect.mapError(toScoringError("Failed to fetch user interests"))
            )

          const interactions = yield* interactionRepo
            .findByUser(userId)
            .pipe(
              Effect.mapError(
                toScoringError("Failed to fetch user interactions")
              )
            )

          const interactedStoryIds = new Set<string>(
            interactions
              .filter(i => i.interactionType !== "hide")
              .map(i => i.storyId)
          )

          const scored = scorer.scoreMany(
            stories,
            interests,
            interactedStoryIds
          )

          const scoredFiltered = scored.filter(
            s =>
              !interactions.some(
                i => i.storyId === s.story.id && i.interactionType === "hide"
              )
          )

          const ranked = ranker.rank(scoredFiltered, limit)

          const offset = (page - 1) * limit
          const pageItems = ranked.items.slice(offset, offset + limit)

          return {
            data: pageItems.map(story => ({
              story: story as Feed["data"][number]["story"],
              score: ranked.scores.get(story.id) ?? 0,
              reason: Option.getOrElse(
                ranked.reasons.get(story.id) ?? Option.none(),
                () => undefined
              ),
            })),
            meta: {
              page,
              limit,
              total,
            },
          } satisfies Feed
        })
      }

      const scoreStory = (
        storyId: string,
        userId: string
      ): Effect.Effect<number, RecommendationError> =>
        Effect.gen(function* () {
          const rawStory = yield* storyRepo
            .findById(storyId)
            .pipe(Effect.mapError(toScoringError("Failed to fetch story")))

          if (Option.isNone(rawStory)) {
            return yield* Effect.fail(
              new NoStoriesError({
                message: `Story ${storyId} not found`,
              })
            )
          }

          const story: StoryWithEvidenceCount = {
            id: rawStory.value.id,
            title: rawStory.value.title,
            slug: rawStory.value.slug,
            summary: rawStory.value.summary ?? "",
            confidence: rawStory.value.confidence ?? 0,
            status: rawStory.value.status,
            createdAt:
              rawStory.value.createdAt instanceof Date
                ? rawStory.value.createdAt.toISOString()
                : String(rawStory.value.createdAt),
            updatedAt:
              rawStory.value.updatedAt instanceof Date
                ? rawStory.value.updatedAt.toISOString()
                : String(rawStory.value.updatedAt),
            evidenceCount: 0,
          }

          const interests = yield* interestRepo
            .findByUserId(userId)
            .pipe(Effect.mapError(toScoringError("Failed to fetch interests")))

          return scorer.scoreOne(story, interests, new Set<string>()).finalScore
        })

      const updateInterests = (
        userId: string,
        storyId: string,
        interactionType: string
      ): Effect.Effect<void, RecommendationError> =>
        Effect.gen(function* () {
          const rawStory = yield* storyRepo
            .findById(storyId)
            .pipe(Effect.mapError(toScoringError("Failed to fetch story")))

          if (Option.isNone(rawStory)) return

          const story: StoryWithEvidenceCount = {
            id: rawStory.value.id,
            title: rawStory.value.title,
            slug: rawStory.value.slug,
            summary: rawStory.value.summary ?? "",
            confidence: rawStory.value.confidence ?? 0,
            status: rawStory.value.status,
            createdAt:
              rawStory.value.createdAt instanceof Date
                ? rawStory.value.createdAt.toISOString()
                : String(rawStory.value.createdAt),
            updatedAt:
              rawStory.value.updatedAt instanceof Date
                ? rawStory.value.updatedAt.toISOString()
                : String(rawStory.value.updatedAt),
            evidenceCount: 0,
          }

          yield* interestLearner.updateFromInteraction(
            userId,
            story,
            interactionType
          )
        })

      return {
        generateFeed,
        scoreStory,
        updateInterests,
      } satisfies RecommendationServiceShape
    }),
  }
) {}

export const RecommendationServiceLive = RecommendationService.Default
