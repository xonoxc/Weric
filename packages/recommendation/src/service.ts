import { Effect } from "effect"
import type {
  StoryRepository,
  InterestRepository,
  InteractionRepository,
  StoryWithEvidenceCount,
} from "@weric/database"
import type { Feed } from "@weric/contracts"
import { StoryScorer } from "./scorer.ts"
import { FeedRanker } from "./ranker.ts"
import { InterestLearner } from "./interest.ts"
import { NoStoriesError, ScoringError } from "./errors.ts"
import type { RecommendationError } from "./errors.ts"

export interface FeedOptions {
  page?: number
  limit?: number
}

const toScoringError = (message: string) => (cause: unknown) =>
  new ScoringError({ message, cause })

export class RecommendationService {
  private scorer = new StoryScorer()
  private ranker = new FeedRanker()

  constructor(
    private readonly storyRepo: StoryRepository,
    private readonly interestRepo: InterestRepository,
    private readonly interactionRepo: InteractionRepository,
    public readonly interestLearner: InterestLearner = new InterestLearner(
      interestRepo
    )
  ) {}

  generateFeed(
    userId: string,
    options: FeedOptions = {}
  ): Effect.Effect<Feed, RecommendationError> {
    const page = options.page ?? 1
    const limit = Math.min(options.limit ?? 50, 100)
    const self = this

    return Effect.gen(function* () {
      const { data: stories, total } = yield* self.storyRepo
        .findPublishedFeed({
          page: 1,
          limit: 100,
        })
        .pipe(
          Effect.catchAll(toScoringError("Failed to fetch published stories"))
        )

      if (stories.length === 0) {
        return {
          data: [] as Feed["data"],
          meta: { page, limit, total: 0 },
        }
      }

      const interests = yield* self.interestRepo
        .findByUserId(userId)
        .pipe(Effect.catchAll(toScoringError("Failed to fetch user interests")))

      const interactions = yield* self.interactionRepo
        .findByUser(userId)
        .pipe(
          Effect.catchAll(toScoringError("Failed to fetch user interactions"))
        )

      const interactedStoryIds = new Set(
        interactions
          .filter(i => i.interactionType !== "hide")
          .map(i => i.storyId)
      )

      const scored = self.scorer.scoreMany(
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

      const ranked = self.ranker.rank(scoredFiltered, limit)

      const offset = (page - 1) * limit
      const pageItems = ranked.items.slice(offset, offset + limit)

      return {
        data: pageItems.map(story => ({
          story: story as Feed["data"][number]["story"],
          score: ranked.scores.get(story.id) ?? 0,
          reason: ranked.reasons.get(story.id),
        })),
        meta: { page, limit, total },
      } as Feed
    })
  }

  scoreStory(
    storyId: string,
    userId: string
  ): Effect.Effect<number, RecommendationError> {
    const self = this
    return Effect.gen(function* () {
      const rawStory = yield* self.storyRepo
        .findById(storyId)
        .pipe(Effect.catchAll(toScoringError("Failed to fetch story")))

      if (!rawStory) {
        return yield* Effect.fail(
          new NoStoriesError({ message: `Story ${storyId} not found` })
        )
      }

      const interests = yield* self.interestRepo
        .findByUserId(userId)
        .pipe(Effect.catchAll(toScoringError("Failed to fetch interests")))

      const st: StoryWithEvidenceCount = {
        id: rawStory.id,
        title: rawStory.title,
        slug: rawStory.slug,
        summary: rawStory.summary ?? "",
        confidence: rawStory.confidence ?? 0,
        status: rawStory.status,
        createdAt:
          rawStory.createdAt instanceof Date
            ? rawStory.createdAt.toISOString()
            : String(rawStory.createdAt),
        updatedAt:
          rawStory.updatedAt instanceof Date
            ? rawStory.updatedAt.toISOString()
            : String(rawStory.updatedAt),
        evidenceCount: 0,
      }

      const scored = self.scorer.scoreOne(st, interests, new Set())
      return scored.finalScore
    })
  }

  updateInterests(
    userId: string,
    storyId: string,
    interactionType: string
  ): Effect.Effect<void, RecommendationError> {
    const self = this
    return Effect.gen(function* () {
      const rawStory = yield* self.storyRepo
        .findById(storyId)
        .pipe(Effect.catchAll(toScoringError("Failed to fetch story")))

      if (!rawStory) return

      const st: StoryWithEvidenceCount = {
        id: rawStory.id,
        title: rawStory.title,
        slug: rawStory.slug,
        summary: rawStory.summary ?? "",
        confidence: rawStory.confidence ?? 0,
        status: rawStory.status,
        createdAt:
          rawStory.createdAt instanceof Date
            ? rawStory.createdAt.toISOString()
            : String(rawStory.createdAt),
        updatedAt:
          rawStory.updatedAt instanceof Date
            ? rawStory.updatedAt.toISOString()
            : String(rawStory.updatedAt),
        evidenceCount: 0,
      }

      yield* self.interestLearner.updateFromInteraction(
        userId,
        st,
        interactionType
      )
    })
  }
}
