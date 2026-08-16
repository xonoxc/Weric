import {
  createDb,
  StoryRepositoryLive,
  EvidenceRepository,
  JobRepository,
  ChatRepository,
} from "@weric/database"
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

function buildRuntime(db: Db) {
  // Story/Interest/Interaction/User repos are now Effect tags — the
  // recommendation jobs wire them via layers. Other jobs still take the
  // class-based repositories directly.
  const storyRepo = StoryRepositoryLive(db) as never
  const evidenceRepo = new EvidenceRepository(db)
  const jobRepo = new JobRepository(db)
  const chatRepo = new ChatRepository(db)
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
    { apiUrl }
  )

  return runtime
}

const db = createDb()
const runtime = buildRuntime(db)
runtime.start()
