import { Hono } from "hono"
import { logger } from "hono/logger"
import { createDb, JobRepository } from "@weric/database"
import { createAuth } from "@weric/auth"
import { errorHandler } from "./middleware/error.ts"
import { createSessionMiddleware } from "./middleware/session.ts"
import { createAuthRoutes } from "./routes/auth.ts"
import { createHealthRoutes } from "./routes/health.ts"
import { createStoriesRoutes } from "./routes/stories.ts"
import { createFeedRoutes } from "./routes/feed.ts"
import { createSearchRoutes } from "./routes/search.ts"
import { createInteractionsRoutes } from "./routes/interactions.ts"
import { createBookmarksRoutes } from "./routes/bookmarks.ts"
import { createInterestsRoutes } from "./routes/interests.ts"
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

app.route("/api/auth", createAuthRoutes(auth))

app.use("*", createSessionMiddleware(auth))

app.route("/health", createHealthRoutes())

app.route("/api/stories", createStoriesRoutes(db))
app.route("/api/feed", createFeedRoutes(db))
app.route("/api/search", createSearchRoutes(db))
app.route("/api/interactions", createInteractionsRoutes(db))
app.route("/api/bookmarks", createBookmarksRoutes(db))
app.route("/api/interests", createInterestsRoutes(db))
app.route("/api", createEventsRoutes(new JobRepository(db)))
app.route("/internal", createWorkerRoutes(new JobRepository(db)))

export default app
