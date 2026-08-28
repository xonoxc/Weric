import {
  createDb,
  Database,
  StoryRepository,
  StoryRepositoryLive,
  EvidenceRepository,
  EvidenceRepositoryLive,
  JobRepository,
  JobRepositoryLive,
  ChatRepository,
  ChatRepositoryLive,
} from "@weric/database"
import { Context, Effect, Layer } from "effect"
import { BrowserService } from "@weric/browser"
import { AIService, groqProvider } from "@weric/ai"
import { WorkerRuntime } from "./runtime.ts"
import { createLearnInterestsHandler } from "./jobs/learn-interests.ts"
import { createDiscoverStoriesHandler } from "./jobs/discover-stories.ts"
import { createSearchDiscoverHandler } from "./jobs/search-discover.ts"
import { createRefreshStoryHandler } from "./jobs/refresh-story.ts"
import { createRecomputeScoresHandler } from "./jobs/recompute-scores.ts"
import { createCleanupEvidenceHandler } from "./jobs/cleanup-evidence.ts"
import { createRebuildRecommendationsHandler } from "./jobs/rebuild-recommendations.ts"

import type { Db } from "@weric/database"

function buildRepos(db: Db) {
  const databaseLayer = Layer.succeed(Database, db)

  const context = Effect.runSync(
    Layer.build(
      Layer.mergeAll(
        StoryRepositoryLive,
        EvidenceRepositoryLive,
        JobRepositoryLive,
        ChatRepositoryLive
      )
    ).pipe(Effect.provide(databaseLayer), Effect.scoped)
  )

  return {
    storyRepo: Context.get(context, StoryRepository),
    evidenceRepo: Context.get(context, EvidenceRepository),
    jobRepo: Context.get(context, JobRepository),
    chatRepo: Context.get(context, ChatRepository),
  }
}

function buildRuntime(db: Db) {
  // Story/Interest/Interaction/User repos are Effect layers — build them once
  // into concrete service objects and pass those to the handlers. The
  // recommendation jobs wire their own layers from `db`.
  const { storyRepo, evidenceRepo, jobRepo, chatRepo } = buildRepos(db)
  const browser = new BrowserService()
  const ai = new AIService(groqProvider)
  const apiUrl = process.env.API_URL ?? "http://localhost:3000"

  if (!process.env.GROQ_API_KEY) {
    console.warn(
      "[Worker] WARNING: GROQ_API_KEY is not set. AI-dependent jobs (search_discover, discover_stories) will fail."
    )
  }

  const runtime = new WorkerRuntime(
    jobRepo,
    [
      createLearnInterestsHandler(db),
      createDiscoverStoriesHandler(storyRepo, evidenceRepo, browser, ai),
      createSearchDiscoverHandler(
        storyRepo,
        evidenceRepo,
        chatRepo,
        browser,
        ai,
        apiUrl
      ),
      createRefreshStoryHandler(storyRepo, evidenceRepo, browser),
      createRecomputeScoresHandler(db),
      createCleanupEvidenceHandler(evidenceRepo),
      createRebuildRecommendationsHandler(db),
    ],
    { apiUrl, maxConcurrency: Number(process.env.WORKER_MAX_CONCURRENCY ?? 10) }
  )

  return runtime
}

const db = createDb()
const runtime = buildRuntime(db)
runtime.start()
