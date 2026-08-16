import { Hono } from "hono"
import { Effect } from "effect"
import { BookmarkRepository } from "@weric/database"
import { CreateBookmarkInputSchema } from "@weric/contracts"
import { z } from "zod"
import { IsoDateString, requireUser } from "~api/lib/validation.ts"

import type { Db } from "@weric/database"
import type { ApiVariables } from "~api/app.ts"

const BookmarkResponse = z.object({
  id: z.string(),
  userId: z.string(),
  storyId: z.string(),
  createdAt: IsoDateString,
})

const StoryIdParam = z.object({ storyId: z.string().uuid() })

export function createBookmarksRoutes(db: Db) {
  const router = new Hono<{ Variables: ApiVariables }>()
  const bookmarkRepo = new BookmarkRepository(db)

  router.get("/", async c => {
    const user = requireUser(c)

    const data = await Effect.runPromise(
      bookmarkRepo.findByUserWithStories(user.id)
    )

    return c.json({ data })
  })

  router.post("/", async c => {
    const user = requireUser(c)
    const { storyId } = CreateBookmarkInputSchema.parse(await c.req.json())

    const result = await Effect.runPromise(
      bookmarkRepo.create(user.id, storyId)
    )

    return c.json(BookmarkResponse.parse(result), 201)
  })

  router.delete("/:storyId", async c => {
    const user = requireUser(c)
    const { storyId } = StoryIdParam.parse(c.req.param())

    await Effect.runPromise(bookmarkRepo.delete(user.id, storyId))

    return c.json({ success: true })
  })

  return router
}
