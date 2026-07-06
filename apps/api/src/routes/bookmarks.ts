import { Hono } from "hono"
import { Effect } from "effect"
import { BookmarkRepository } from "@weric/database"
import type { Db } from "@weric/database"
import type { ApiVariables } from "../index.ts"

export function createBookmarksRoutes(db: Db) {
  const router = new Hono<{ Variables: ApiVariables }>()
  const bookmarkRepo = new BookmarkRepository(db)

  router.get("/", async c => {
    const user = c.get("user")
    if (!user) {
      return c.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        401
      )
    }

    const data = await Effect.runPromise(
      bookmarkRepo.findByUserWithStories(user.id)
    )

    return c.json({ data })
  })

  router.post("/", async c => {
    const user = c.get("user")
    if (!user) {
      return c.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        401
      )
    }

    const body = await c.req.json()
    if (!body.storyId || typeof body.storyId !== "string") {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "storyId is required and must be a string",
          },
        },
        400
      )
    }

    const result = await Effect.runPromise(
      bookmarkRepo.create(user.id, body.storyId)
    )

    return c.json(
      {
        id: result.id,
        userId: result.userId,
        storyId: result.storyId,
        createdAt:
          result.createdAt instanceof Date
            ? result.createdAt.toISOString()
            : String(result.createdAt),
      },
      201
    )
  })

  router.delete("/:storyId", async c => {
    const user = c.get("user")
    if (!user) {
      return c.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        401
      )
    }

    const storyId = c.req.param("storyId")

    await Effect.runPromise(bookmarkRepo.delete(user.id, storyId))

    return c.json({ success: true })
  })

  return router
}
