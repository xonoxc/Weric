import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { createDb } from "@weric/database"
import { createAuth } from "@weric/auth"
import type { AuthUser, AuthSession } from "@weric/auth"
import { errorHandler } from "./middleware/error.ts"
import { createStoriesRoutes } from "./routes/stories.ts"
import { createFeedRoutes } from "./routes/feed.ts"
import { createSearchRoutes } from "./routes/search.ts"
import { createInteractionsRoutes } from "./routes/interactions.ts"
import { createBookmarksRoutes } from "./routes/bookmarks.ts"
import { createInterestsRoutes } from "./routes/interests.ts"
import { validateEnv } from "./lib/validateEnv.ts"

validateEnv()

const db = createDb()
const auth = createAuth(db)

export interface ApiVariables {
  user: AuthUser | null
  session: AuthSession | null
}

const app = new Hono<{ Variables: ApiVariables }>()

app.onError(errorHandler)

app.use("*", logger())

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

  c.set("user", session.user as AuthUser)
  c.set("session", session.session as AuthSession)
  await next()
})

app.get("/health", c =>
  c.json({
    status: "ok",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  })
)

app.route("/api/stories", createStoriesRoutes(db))
app.route("/api/feed", createFeedRoutes(db))
app.route("/api/search", createSearchRoutes(db))
app.route("/api/interactions", createInteractionsRoutes(db))
app.route("/api/bookmarks", createBookmarksRoutes(db))
app.route("/api/interests", createInterestsRoutes(db))

export default app
