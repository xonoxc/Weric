import { Hono } from "hono"
import { cors } from "hono/cors"
import { Effect, Layer } from "effect"
import {
  AuthController,
  AuthControllerLive,
} from "~api/controllers/auth.controller"
import { AuthServiceLive } from "~api/services/auth.service"
import { DatabaseLive } from "~db/connection"
import { effectHandler } from "~api/lib/handler"

import type { ApiVariables } from "~api/app.ts"

export function createAuthRoutes() {
  const router = new Hono<{ Variables: ApiVariables }>()

  const APILive = AuthControllerLive.pipe(
    Layer.provide(AuthServiceLive),
    Layer.provide(DatabaseLive)
  )

  router.use(
    "*",
    cors({
      origin: process.env.WEB_URL ?? "http://localhost:5173",
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      maxAge: 600,
      credentials: true,
    })
  )

  router.on(
    ["POST", "GET"],
    "*",
    effectHandler(
      ctx =>
        Effect.gen(function* () {
          const controller = yield* AuthController
          return yield* controller.handle(ctx)
        }),
      APILive
    )
  )

  return router
}
