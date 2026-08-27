import { Hono } from "hono"
import { logger } from "hono/logger"
import { createDb } from "@weric/database"
import { createAuth } from "@weric/auth"
import { errorHandler } from "./middleware/error.ts"
import { createSessionMiddleware } from "./middleware/session.ts"
import { createAuthRoutes } from "./routes/auth.ts"
import { createHealthRoutes } from "./routes/health.ts"
import { createStoriesRoutes } from "./routes/stories.ts"
import { createFeedRoutes } from "./routes/feed.ts"
import { createSearchRoutes } from "./routes/search.ts"
import { createChatRoutes } from "./routes/chats.ts"
import { createInteractionsRoutes } from "./routes/interactions.ts"
import { createBookmarksRoutes } from "./routes/bookmarks.ts"
import { createInterestsRoutes } from "./routes/interests.ts"
import { createProfileRoutes } from "./routes/profile.ts"
import { createEventsRoutes } from "./routes/events.ts"
import { createWorkerRoutes } from "./routes/worker.ts"

import type { AuthUser, AuthSession } from "@weric/auth"

const db = createDb()
const auth = createAuth(db)

export interface ApiVariables {
  user: AuthUser | null
  session: AuthSession | null
}

const app = new Hono<{ Variables: ApiVariables }>()

app.onError(errorHandler)

app.use("*", logger())

app.route("/api/auth", createAuthRoutes())

app.use("*", createSessionMiddleware(auth))

app.route("/health", createHealthRoutes())

app.route("/api/stories", createStoriesRoutes())
app.route("/api/feed", createFeedRoutes())
app.route("/api/search", createSearchRoutes())
app.route("/api/chats", createChatRoutes())
app.route("/api/interactions", createInteractionsRoutes())
app.route("/api/bookmarks", createBookmarksRoutes())
app.route("/api/interests", createInterestsRoutes())
app.route("/api/profile", createProfileRoutes())
app.route("/api", createEventsRoutes())
app.route("/internal", createWorkerRoutes())

export default app
