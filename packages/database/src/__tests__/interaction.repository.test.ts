import { describe, expect, it, beforeEach } from "vitest"
import { Effect, Layer } from "effect"
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
import type { InteractionRepositoryShape } from "~db/repositories/interaction.repository.ts"

import { Database } from "~db/connection.ts"
import type { Db } from "~db/connection.ts"

describe("InteractionRepository", () => {
  let repo: InteractionRepositoryShape
  let userId: string
  let storyId: string

  beforeEach(async () => {
    await cleanDatabase()
    const db: Db = getTestDb()
    const DatabaseLayer = Layer.succeed(Database, db)
    repo = Effect.runSync(
      Effect.gen(function* () {
        return yield* InteractionRepository
      }).pipe(
        Effect.provide(
          InteractionRepositoryLive.pipe(Layer.provide(DatabaseLayer))
        )
      )
    )
    const storyRepo = Effect.runSync(
      Effect.gen(function* () {
        return yield* StoryRepository
      }).pipe(
        Effect.provide(StoryRepositoryLive.pipe(Layer.provide(DatabaseLayer)))
      )
    )

    const [user] = await db
      .insert(users)
      .values({
        name: "Int User",
        email: "int@test.com",
        username: "intuser",
      })
      .returning()
    userId = user!.id

    const story = await Effect.runPromise(
      storyRepo.create({ title: "Int Story", slug: "int-story" })
    )
    storyId = story.id
  })

  it("creates an interaction", async () => {
    const interaction = await Effect.runPromise(
      repo.create({ userId, storyId, interactionType: "view" })
    )
    expect(interaction.userId).toBe(userId)
    expect(interaction.storyId).toBe(storyId)
    expect(interaction.interactionType).toBe("view")
  })

  it("creates an interaction with duration", async () => {
    const interaction = await Effect.runPromise(
      repo.create({ userId, storyId, interactionType: "read", duration: 120 })
    )
    expect(interaction.duration).toBe(120)
  })

  it("finds interactions by user", async () => {
    await Effect.runPromise(
      repo.create({ userId, storyId, interactionType: "view" })
    )
    await Effect.runPromise(
      repo.create({ userId, storyId, interactionType: "like" })
    )

    const results = await Effect.runPromise(repo.findByUser(userId))
    expect(results.length).toBe(2)
  })

  it("finds interactions by story", async () => {
    await Effect.runPromise(
      repo.create({ userId, storyId, interactionType: "view" })
    )

    const results = await Effect.runPromise(repo.findByStory(storyId))
    expect(results.length).toBe(1)
  })

  it("aggregates interactions by type", async () => {
    await Effect.runPromise(
      repo.create({ userId, storyId, interactionType: "view" })
    )
    await Effect.runPromise(
      repo.create({ userId, storyId, interactionType: "view" })
    )
    await Effect.runPromise(
      repo.create({ userId, storyId, interactionType: "like" })
    )

    const aggs = await Effect.runPromise(repo.aggregateByType(userId))
    expect(aggs.length).toBe(2)
    const viewAgg = aggs.find(a => a.interactionType === "view")
    expect(viewAgg).toBeDefined()
    expect(viewAgg!.count).toBe(2)
  })
})
