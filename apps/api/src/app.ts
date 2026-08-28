import { Hono } from "hono"
import { logger } from "hono/logger"
import { errorHandler } from "./middleware/error.ts"
import { createSessionMiddleware } from "./middleware/session.ts"
import { createAuthRoutes } from "./routes/auth.router.ts"
import { createHealthRoutes } from "./routes/health.router.ts"
import { createStoriesRoutes } from "./routes/stories.router.ts"
import { createFeedRoutes } from "./routes/feed.router.ts"
import { createSearchRoutes } from "./routes/search.router.ts"
import { createChatRoutes } from "./routes/chats.router.ts"
import { createInteractionsRoutes } from "./routes/interactions.router.ts"
import { createBookmarksRoutes } from "./routes/bookmarks.router.ts"
import { createInterestsRoutes } from "./routes/interests.router.ts"
import { createProfileRoutes } from "./routes/profile.router.ts"
import { createEventsRoutes } from "./routes/events.router.ts"
import { createWorkerRoutes } from "./routes/worker.router.ts"

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
