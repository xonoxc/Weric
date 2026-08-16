## 1. Config Unification

- [x] 1.1 Add BETTER_AUTH_SECRET, BETTER_AUTH_URL, and GROQ_API_KEY to @weric/config package
- [x] 1.2 Update loadDatabaseConfig to read DATABASE_URL from process.env when no argument provided
- [x] 1.3 Remove apps/api/src/lib/validateEnv.ts and wire API to use @weric/config
- [x] 1.4 Remove apps/web/src/lib/result.ts Axios import branches and `any` types
- [x] 1.5 Deduplicate STOP_WORDS into @weric/shared and update diversifier.ts and interest.ts to import from there

## 2. Bug Fixes

- [x] 2.1 Fix withRetryWhile in packages/shared/src/effect/with-retry.ts to correctly compose error channels
- [x] 2.2 Define or remove the placeholder AppError type in packages/shared/src/effect/errors.ts
- [x] 2.3 Fix fire-and-forget in apps/api/src/routes/interactions.ts — await the Effect.runPromise call
- [x] 2.4 Remove debug console.log statements from apps/web/src/lib/api-client.ts
- [x] 2.5 Fix StoryMatcher to not cap at 100 stories — use a configurable limit or remove the cap

## 3. User Interests (Onboarding)

- [x] 3.1 Create POST /api/interests route that accepts a topics array and upserts interests for the authenticated user
- [x] 3.2 Update apps/web/src/hooks/useOnboarding.ts to call POST /api/interests with selected topics before navigating
- [x] 3.3 Add contract schema for POST /api/interests request body in packages/contracts

## 4. Bookmark Sync

- [x] 4.1 Update StoryCard bookmark state to accept initial value from parent, not useState(false)
- [x] 4.2 Update apps/web/src/hooks/useHome.ts handleBookmark to call API client toggleBookmark
- [ ] 4.3 Implement optimistic update with revert on API failure in the bookmark handler
- [ ] 4.4 Add auth guard for bookmark clicks — redirect to login if unauthenticated

## 5. Story Detail

- [ ] 5.1 Create /:slug route in apps/web/src/App.tsx that loads story detail
- [ ] 5.2 Create StoryDetail component that displays full content, evidence list, and entities by type
- [ ] 5.3 Update apps/web/src/hooks/useHome.ts handleExpand to navigate to /:slug instead of console.log
- [ ] 5.4 Add "Story not found" fallback for missing stories

## 6. Worker Job Completion

- [ ] 6.1 Add a deleteByAge method to the evidence repository (or use existing findMany + delete loop)
- [ ] 6.2 Rewrite apps/worker/src/jobs/cleanup-evidence.ts to loop through all pages and delete old evidence
- [ ] 6.3 Rewrite apps/worker/src/jobs/recompute-scores.ts to persist scores (remove user.slice(0, 10) cap)
- [ ] 6.4 Rewrite apps/worker/src/jobs/rebuild-recommendations.ts to persist recommendation results
- [ ] 6.5 Add a job scheduler to apps/worker/src/runtime.ts that enqueues periodic jobs (cleanup daily, recompute hourly)

## 7. AI Story Processing

- [ ] 7.1 Inject AIService into StoryService via Effect layer
- [ ] 7.2 Update StoryService.ingest() to call AIService.summarize for each story
- [ ] 7.3 Update StoryService.ingest() to call AIService.extractEntities instead of EntityExtractor
- [ ] 7.4 Add fallback: if AI extraction fails, fall back to rule-based EntityExtractor
- [ ] 7.5 Remove double Effect.runPromise anti-pattern in apps/worker/src/jobs/discover-stories.ts

## 8. Cleanup and Polish

- [ ] 8.1 Remove the unused Axios dependency from apps/web/package.json
- [ ] 8.2 Remove or properly implement the RepositoryTestLayer (currently aliased to LiveLayer)
- [ ] 8.3 Remove debug console.log statements from apps/web/src/lib/result.ts
- [ ] 8.4 Update apps/web/src/lib/api-client.ts to remove Axios error handling branches
