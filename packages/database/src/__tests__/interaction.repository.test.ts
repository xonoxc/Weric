import { describe, expect, it, beforeEach } from "@effect/vitest"
import { Effect, Layer, Option } from "effect"
import {
  InteractionRepository,
  InteractionRepositoryLive,
} from "~db/repositories/interaction.repository.ts"
import {
  StoryRepository,
  StoryRepositoryLive,
} from "~db/repositories/story.repository.ts"
import { getTestDb, cleanDatabase } from "~db/__tests__/helpers.ts"
import { users } from "~db/schema/tables.ts"

import { Database } from "~db/connection.ts"
import type { Db } from "~db/connection.ts"

const databaseLayer = Layer.effect(
  Database,
  Effect.sync(() => getTestDb())
)

const interactionRepoLayer = Layer.mergeAll(
  databaseLayer,
  InteractionRepositoryLive.pipe(Layer.provide(databaseLayer)),
  StoryRepositoryLive.pipe(Layer.provide(databaseLayer))
)

function insertTestUser(db: Db): Effect.Effect<typeof users.$inferSelect> {
  return Effect.promise(async () => {
    const [row] = await db
      .insert(users)
      .values({
        name: "Int User",
        email: "int@test.com",
        username: "intuser",
      })
      .returning()

    return row!
  })
}

describe("InteractionRepository", () => {
  beforeEach(() => cleanDatabase())

  it.effect("creates an interaction", () =>
    Effect.gen(function* () {
      const repo = yield* InteractionRepository
      const storyRepo = yield* StoryRepository
      const db = yield* Database

      const user = yield* insertTestUser(db)

      const story = yield* storyRepo.create({
        title: "Int Story",
        slug: "int-story",
        summary: Option.none(),
      })

      const interaction = yield* repo.create({
        userId: user.id,
        storyId: story.id,
        interactionType: "view",
        duration: Option.none(),
      })

      expect(interaction.userId).toBe(user.id)
      expect(interaction.storyId).toBe(story.id)

      expect(interaction.interactionType).toBe("view")
    }).pipe(Effect.provide(interactionRepoLayer))
  )

  it.effect("creates an interaction with duration", () =>
    Effect.gen(function* () {
      const repo = yield* InteractionRepository
      const storyRepo = yield* StoryRepository
      const db = yield* Database

      const user = yield* insertTestUser(db)

      const story = yield* storyRepo.create({
        title: "Int Story",
        slug: "int-story",
        summary: Option.none(),
      })

      const interaction = yield* repo.create({
        userId: user.id,
        storyId: story.id,
        interactionType: "read",
        duration: Option.some(120),
      })

      expect(interaction.duration).toBe(120)
    }).pipe(Effect.provide(interactionRepoLayer))
  )

  it.effect("finds interactions by user", () =>
    Effect.gen(function* () {
      const repo = yield* InteractionRepository
      const storyRepo = yield* StoryRepository
      const db = yield* Database

      const user = yield* insertTestUser(db)

      const story = yield* storyRepo.create({
        title: "Int Story",
        slug: "int-story",
        summary: Option.none(),
      })

      yield* repo.create({
        userId: user.id,
        storyId: story.id,
        interactionType: "view",
        duration: Option.none(),
      })
      yield* repo.create({
        userId: user.id,
        storyId: story.id,
        interactionType: "like",
        duration: Option.none(),
      })

      const results = yield* repo.findByUser(user.id)

      expect(results.length).toBe(2)
    }).pipe(Effect.provide(interactionRepoLayer))
  )

  it.effect("finds interactions by story", () =>
    Effect.gen(function* () {
      const repo = yield* InteractionRepository
      const storyRepo = yield* StoryRepository
      const db = yield* Database

      const user = yield* insertTestUser(db)

      const story = yield* storyRepo.create({
        title: "Int Story",
        slug: "int-story",
        summary: Option.none(),
      })

      yield* repo.create({
        userId: user.id,
        storyId: story.id,
        interactionType: "view",
        duration: Option.none(),
      })

      const results = yield* repo.findByStory(story.id)

      expect(results.length).toBe(1)
    }).pipe(Effect.provide(interactionRepoLayer))
  )

  it.effect("aggregates interactions by type", () =>
    Effect.gen(function* () {
      const repo = yield* InteractionRepository
      const storyRepo = yield* StoryRepository
      const db = yield* Database

      const user = yield* insertTestUser(db)

      const story = yield* storyRepo.create({
        title: "Int Story",
        slug: "int-story",
        summary: Option.none(),
      })

      yield* repo.create({
        userId: user.id,
        storyId: story.id,
        interactionType: "view",
        duration: Option.none(),
      })
      yield* repo.create({
        userId: user.id,
        storyId: story.id,
        interactionType: "view",
        duration: Option.none(),
      })
      yield* repo.create({
        userId: user.id,
        storyId: story.id,
        interactionType: "like",
        duration: Option.none(),
      })

      const aggs = yield* repo.aggregateByType(user.id)
      expect(aggs.length).toBe(2)

      const viewAgg = aggs.find(a => a.interactionType === "view")
      expect(viewAgg).toBeDefined()

      expect(viewAgg!.count).toBe(2)
    }).pipe(Effect.provide(interactionRepoLayer))
  )
})
