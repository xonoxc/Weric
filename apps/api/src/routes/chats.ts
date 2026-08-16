import { Hono } from "hono"
import { Effect } from "effect"
import { ChatRepository } from "@weric/database"
import { z } from "zod"
import { requireUser } from "~api/lib/validation.ts"

import type { Db } from "@weric/database"
import type { ApiVariables } from "~api/app.ts"

const CreateChatRequest = z.object({
  query: z.string().trim().min(1).max(500).optional(),
})

const ChatIdParam = z.object({ id: z.string().min(1) })

export function defaultChatTitle(date = new Date()): string {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function createChatRoutes(db: Db) {
  const router = new Hono<{ Variables: ApiVariables }>()
  const chatRepo = new ChatRepository(db)

  router.get("/", async c => {
    const user = requireUser(c)

    const data = await Effect.runPromise(chatRepo.findByUser(user.id))

    return c.json({
      data,
      meta: { total: data.length },
    })
  })

  router.post("/", async c => {
    const user = requireUser(c)
    const body = CreateChatRequest.parse(await c.req.json())

    const chat = await Effect.runPromise(
      chatRepo.create({
        title: defaultChatTitle(),
        query: body.query ?? null,
        userId: user.id,
      })
    )

    return c.json(chat, 201)
  })

  router.get("/:id", async c => {
    const user = requireUser(c)
    const { id } = ChatIdParam.parse(c.req.param())

    const chat = await Effect.runPromise(chatRepo.findById(id))
    if (!chat || chat.userId !== user.id) {
      return c.json(
        { error: { code: "NOT_FOUND", message: "Chat not found" } },
        404
      )
    }

    const detail = await Effect.runPromise(chatRepo.findByIdWithStories(id))
    return c.json(detail)
  })

  router.delete("/:id", async c => {
    const user = requireUser(c)
    const { id } = ChatIdParam.parse(c.req.param())

    const chat = await Effect.runPromise(chatRepo.findById(id))
    if (!chat || chat.userId !== user.id) {
      return c.json(
        { error: { code: "NOT_FOUND", message: "Chat not found" } },
        404
      )
    }

    await Effect.runPromise(chatRepo.delete(id))
    return c.json({ ok: true })
  })

  return router
}
