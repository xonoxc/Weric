import { Hono } from "hono"

export function createHealthRoutes() {
  const router = new Hono()

  router.get("/", c =>
    c.json({
      status: "ok",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
    })
  )

  return router
}
