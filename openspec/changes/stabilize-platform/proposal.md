## Why

Weric is a well-architected skeleton with roughly half its features as stubs, no-ops, or broken code. The infrastructure investment is high quality — database layer, contracts, recommendation engine — but critical user-facing features (onboarding persistence, bookmark sync, story detail) don't work, several worker jobs silently do nothing, and the AI capabilities defined in the AI package are never called by the core pipeline. The platform cannot deliver value to users in its current state.

## What Changes

- **Fix broken user flows**: Onboarding selections are saved as interests, bookmarks sync to the API, story expand navigates to a detail view
- **Activate worker jobs**: Cleanup evidence actually deletes old records, recompute scores persists results, rebuild recommendations writes to the database
- **Wire AI into the pipeline**: Story engine uses AI summarization and entity extraction instead of rule-based heuristics
- **Fix the Effect layer system**: Apps use `Layer.provide` instead of direct instantiation; eliminate the double `Effect.runPromise` anti-pattern
- **Complete the config system**: Unify the duplicated config packages and fix `loadDatabaseConfig` to read environment variables
- **Remove dead code**: Axios dependency, duplicate STOP_WORDS, console.log debug statements, placeholder `AppError` type
- **Fix the retry logic bug**: `withRetryWhile` correctly composes error channels
- **Add missing backend pieces**: POST /interests endpoint, job scheduler for periodic jobs, relationship extraction stub
- **Remove the 100-story cap on deduplication matching**

## Capabilities

### New Capabilities

- `user-interests`: Onboarding flow saves selected topics as user interests via a new POST /api/interests endpoint
- `bookmark-sync`: Frontend bookmark toggle persists to the API and reflects server state
- `story-detail`: Clicking a story opens a detail view showing full content, evidence, and entities
- `worker-job-completion`: Cleanup evidence, recompute scores, and rebuild recommendations jobs fully execute and persist results
- `ai-story-processing`: Story engine pipeline calls AI for summarization and structured entity extraction
- `config-unification`: Single config source using Effect's Config module, read by all apps

### Modified Capabilities

(none — no existing specs to modify)

## Impact

- **API**: New POST /api/interests route, new GET /api/stories/:slug/detail route (if needed beyond existing), updated interaction endpoint to properly await interest updates
- **Web**: Onboarding hook calls API, home hook calls API for expand/bookmark, new story detail route
- **Worker**: Three job handlers rewritten to actually persist results, job scheduler added
- **Story Engine**: EntityExtractor replaced with AI-backed implementation, ingest pipeline calls AIService
- **Database**: Possibly new columns or tables for relationship tracking (if scope includes extraction)
- **Config**: Merged config package, `loadDatabaseConfig` reads env, API validateEnv removed or unified
- **Packages**: Axios removed from web, duplicate STOP_WORDS deduplicated into shared, `withRetryWhile` fixed, `AppError` type defined or removed, console.log statements removed
