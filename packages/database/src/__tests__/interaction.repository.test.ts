import { describe, expect, it, beforeEach } from "vitest"
import { Effect } from "effect"
import { InteractionRepository } from "~/repositories/interaction.repository.ts"
import { StoryRepository } from "~/repositories/story.repository.ts"
import { UserRepository } from "~/repositories/user.repository.ts"
import { getTestDb, cleanDatabase } from "~/__tests__/helpers.ts"
import type { Db } from "~/connection.ts"

describe("InteractionRepository", () => {
  let repo: InteractionRepository
  let userId: string
  let storyId: string

  beforeEach(async () => {
    await cleanDatabase()
    const db: Db = getTestDb()
    repo = new InteractionRepository(db)
    const storyRepo = new StoryRepository(db)
    const userRepo = new UserRepository(db)

    const user = await Effect.runPromise(
      userRepo.create({ email: "int@test.com", username: "intuser" })
    )
    userId = user.id

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
    await Effect.runPromise(repo.create({ userId, storyId, interactionType: "view" }))
    await Effect.runPromise(repo.create({ userId, storyId, interactionType: "like" }))

    const results = await Effect.runPromise(repo.findByUser(userId))
    expect(results.length).toBe(2)
  })

  it("finds interactions by story", async () => {
    await Effect.runPromise(repo.create({ userId, storyId, interactionType: "view" }))

    const results = await Effect.runPromise(repo.findByStory(storyId))
    expect(results.length).toBe(1)
  })

  it("aggregates interactions by type", async () => {
    await Effect.runPromise(repo.create({ userId, storyId, interactionType: "view" }))
    await Effect.runPromise(repo.create({ userId, storyId, interactionType: "view" }))
    await Effect.runPromise(repo.create({ userId, storyId, interactionType: "like" }))

    const aggs = await Effect.runPromise(repo.aggregateByType(userId))
    expect(aggs.length).toBe(2)
    const viewAgg = aggs.find(a => a.interactionType === "view")
    expect(viewAgg).toBeDefined()
    expect(viewAgg!.count).toBe(2)
  })
})
