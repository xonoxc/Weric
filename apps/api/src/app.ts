import { Hono } from "hono"
import { logger } from "hono/logger"
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
import { buildAppContext } from "~api/lib/app-context"

export interface ApiVariables {
  user: AuthUser | null
  session: AuthSession | null
}

const { context: appContext, auth } = buildAppContext()

const app = new Hono<{ Variables: ApiVariables }>()

app.onError(errorHandler)

app.use("*", logger())

app.route("/api/auth", createAuthRoutes(appContext))

app.use("*", createSessionMiddleware(auth))

app.route("/health", createHealthRoutes(appContext))

app.route("/api/stories", createStoriesRoutes(appContext))
app.route("/api/feed", createFeedRoutes(appContext))
app.route("/api/search", createSearchRoutes(appContext))
app.route("/api/chats", createChatRoutes(appContext))
app.route("/api/interactions", createInteractionsRoutes(appContext))
app.route("/api/bookmarks", createBookmarksRoutes(appContext))
app.route("/api/interests", createInterestsRoutes(appContext))
app.route("/api/profile", createProfileRoutes(appContext))
app.route("/api", createEventsRoutes(appContext))
app.route("/internal", createWorkerRoutes(appContext))

export default app
