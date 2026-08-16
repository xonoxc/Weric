## Context

Weric is a monorepo with a solid architectural foundation: Effect-based packages, Hono API, React frontend, Bun worker, and Drizzle ORM with Postgres. The codebase has high-quality infrastructure (database layer, contracts, recommendation engine) but roughly half its features are stubs, no-ops, or have obvious bugs. The platform cannot deliver user value in its current state.

The problems fall into categories:

- **Broken user flows**: Onboarding doesn't save, bookmarks don't sync, story expand is a console.log
- **Dead worker jobs**: Cleanup, recompute, and rebuild jobs read data and log stats but never persist
- **Unused AI**: The AI package's summarize/extract capabilities are defined but never called by the story engine
- **Architectural debt**: Duplicate configs, broken retry logic, Effect layers built but not used, dead Axios dependency

## Goals / Non-Goals

**Goals:**

- Make onboarding, bookmarking, and story detail functional end-to-end
- Activate all worker jobs so they actually process data
- Wire AI summarization and entity extraction into the story pipeline
- Fix the Effect layer system so apps use it properly
- Unify the config system
- Remove dead code and fix known bugs

**Non-Goals:**

- New features not listed in the proposal (e.g., new search providers, relationship extraction beyond a stub)
- Performance optimization or scaling work
- Comprehensive test coverage (only fixing existing broken tests if any)
- UI redesign or new pages beyond story detail

## Decisions

### 1. Fix onboarding by adding POST /api/interests and wiring the frontend hook

The API already has GET /api/interests but no write endpoint. The onboarding page collects topic selections but discards them. We'll add a POST endpoint that upserts interests for the authenticated user, and the onboarding hook will call it before navigating to home.

**Why**: Minimal change — the contracts already define Interest schemas, the database has the interests table with user_id/topic/score columns, and the InterestLearner already knows how to update interests. We're just missing the write path from the UI.

**Alternative considered**: Store interests in localStorage and sync on first API call. Rejected because it creates a state sync problem and doesn't work across devices.

### 2. Wire bookmark toggle to the existing API client method

The API client already has `toggleBookmark` defined. The StoryCard bookmark handler just needs to call it and update local state optimistically.

**Why**: The API endpoint exists, the contract exists, the client method exists — just need to connect them.

### 3. Story detail as a route parameter, not a separate page

Add `/:slug` route that loads story detail from the existing `/api/stories/:slug` endpoint. This endpoint already returns evidence and entities.

**Why**: The API already serves full story detail. No new backend work needed beyond the route.

### 4. Worker jobs: implement actual persistence

- `cleanup-evidence`: Use the evidence repo's delete method (or add one if missing) and loop through all pages, not just the first 1000
- `recompute-scores`: Call FeedRanker for each user and persist scores to the interactions table
- `rebuild-recommendations`: Generate feeds and cache them (or store as materialized view)

**Why**: These jobs already have the right structure — they just need the final "write" step. The recommendation engine is well-tested; we just need to persist its output.

### 5. AI entity extraction replaces rule-based EntityExtractor

The AI package's `extractEntities` method calls Groq for structured extraction. We'll inject AIService into the story engine and use it in the ingest pipeline instead of the regex-based approach.

**Why**: The rule-based extractor is fragile and misses entities. The AI extractor returns structured data matching the existing Entity schema.

**Trade-off**: Adds latency per story (Groq call). Mitigated by running extraction in the worker, not the API request path.

### 6. Config unification: keep @weric/config, remove validateEnv.ts

The Effect-based Config package is more principled. We'll make it read all env vars (including BETTER_AUTH_SECRET/BETTER_AUTH_URL) and have the API use it instead of its own Zod-based validation.

**Why**: Eliminates duplication and ensures all apps share the same config system.

### 7. Fix withRetryWhile to use Effect.retry directly

The current implementation catches errors and retries a fresh copy of the effect, but the composition is broken. We'll rewrite it to use Effect's built-in retry with a while predicate.

**Why**: The current code has a logic bug where catchAll + retry don't compose correctly.

### 8. Unify STOP_WORDS into @weric/shared

Create a single `STOP_WORDS` Set in the shared package. Both diversifier and interest learner import from there.

**Why**: Eliminates drift between two slightly different sets.

### 9. Add a simple job scheduler using setInterval in the worker

The worker already has the runtime and job handlers. We'll add a scheduler that enqueues periodic jobs (cleanup_evidence daily, recompute_scores hourly, learn_interests on user activity).

**Why**: Jobs currently only trigger from the search route. Periodic jobs need a trigger.

**Alternative considered**: Use a dedicated scheduler service (Bull, Agenda). Overkill for this stage — setInterval with error handling is sufficient.

## Risks / Trade-offs

- **[Risk] AI extraction adds latency to story ingestion** → Mitigated by running in worker, not API. Stories can be created without AI entities initially, then enriched asynchronously.
- **[Risk] Config unification might break existing env var usage** → Mitigated by careful mapping of all env vars used across apps before merging.
- **[Risk] Worker job persistence might have race conditions if jobs overlap** → Mitigated by the existing concurrency limit (max 3) and idempotent operations.
- **[Trade-off] Not adding pagination/infinite scroll to feed** → Proposal explicitly excludes this; can be a follow-up change.
- **[Trade-off] Not fixing the 100-story matcher cap to use a smarter approach** → Will increase the limit but not implement full similarity search (out of scope).
