import { Hono } from "hono"
import { cors } from "hono/cors"
import { Effect } from "effect"
import {
  AuthController,
  AuthControllerLive,
} from "~api/controllers/auth.controller"
import { buildRouteContext, effectHandler } from "~api/lib/handler"
import type { AppContext } from "~api/lib/app-context"

import type { ApiVariables } from "~api/app.ts"

export function createAuthRoutes(base: AppContext) {
  const router = new Hono<{ Variables: ApiVariables }>()

  const routeContext = buildRouteContext(AuthControllerLive, base)

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
      routeContext
    )
  )

  return router
}
