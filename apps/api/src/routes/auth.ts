import { Hono } from "hono"
import { cors } from "hono/cors"

import type { Auth } from "@weric/auth"

export function createAuthRoutes(auth: Auth) {
  const router = new Hono()

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

  router.on(["POST", "GET"], "*", c => auth.handler(c.req.raw))

  return router
}
