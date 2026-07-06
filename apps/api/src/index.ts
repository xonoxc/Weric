import { Hono } from "hono"
import { cors } from "hono/cors"
import { createDb } from "@weric/database"
import { createAuth } from "@weric/auth"

const db = createDb()
const auth = createAuth(db)

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

app.use(
  "/api/auth/*",
  cors({
    origin: process.env.WEB_URL ?? "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
)

app.on(["POST", "GET"], "/api/auth/*", c => auth.handler(c.req.raw))

app.use("*", async (c, next) => {
  if (c.req.path.startsWith("/api/auth")) {
    await next()
    return
  }

  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session) {
    c.set("user", null)
    c.set("session", null)
    await next()
    return
  }

  c.set("user", session.user)
  c.set("session", session.session)
  await next()
})

app.get("/health", c => c.json({ status: "ok", version: "0.1.0" }))

export default app
