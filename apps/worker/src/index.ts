import {
  createDb,
  StoryRepository,
  EvidenceRepository,
  InterestRepository,
  InteractionRepository,
  UserRepository,
  JobRepository,
} from "@weric/database"
import type { Db } from "@weric/database"
import { BrowserService } from "@weric/browser"
import { AIService, groqProvider } from "@weric/ai"
import { WorkerRuntime } from "./runtime.ts"
import { createLearnInterestsHandler } from "./jobs/learn-interests.ts"
import { createDiscoverStoriesHandler } from "./jobs/discover-stories.ts"
import { createRefreshStoryHandler } from "./jobs/refresh-story.ts"
import { createRecomputeScoresHandler } from "./jobs/recompute-scores.ts"
import { createCleanupEvidenceHandler } from "./jobs/cleanup-evidence.ts"
import { createRebuildRecommendationsHandler } from "./jobs/rebuild-recommendations.ts"

function buildRuntime(db: Db) {
  const storyRepo = new StoryRepository(db)
  const evidenceRepo = new EvidenceRepository(db)
  const interestRepo = new InterestRepository(db)
  const interactionRepo = new InteractionRepository(db)
  const userRepo = new UserRepository(db)
  const jobRepo = new JobRepository(db)
  const browser = new BrowserService()
  const ai = new AIService(groqProvider)

  const runtime = new WorkerRuntime(jobRepo, [
    createLearnInterestsHandler(
      storyRepo,
      interestRepo,
      interactionRepo,
      userRepo
    ),
    createDiscoverStoriesHandler(storyRepo, evidenceRepo, browser, ai),
    createRefreshStoryHandler(storyRepo, evidenceRepo, browser),
    createRecomputeScoresHandler(
      storyRepo,
      interestRepo,
      interactionRepo,
      userRepo
    ),
    createCleanupEvidenceHandler(evidenceRepo),
    createRebuildRecommendationsHandler(
      storyRepo,
      interestRepo,
      interactionRepo,
      userRepo
    ),
  ])

  return runtime
}

const db = createDb()
const runtime = buildRuntime(db)
runtime.start()
