# Tasks — Execution Plan

This document defines the complete execution plan for Weric v0.1.

**Strategy:** Build bottom-up. Infrastructure before orchestration. Contracts before implementation. Domain before transport. Finish one subsystem before beginning another. Keep every commit deployable.

---

## Milestone 1: Repository Bootstrap

**Goal:** Initialize the monorepo with build tooling and basic project structure.

**Deliverables:**
- Root `package.json` with workspace configuration
- `bun init` in each app and package directory
- Root `tsconfig.json` with strict settings
- Root `biome.json` for formatting and linting
- `.gitignore` covering Node, Bun, and build artifacts
- `.env.example` with all required environment variables
- `docker-compose.yml` for local PostgreSQL
- `Makefile` or `package.json` scripts for common commands

**Directory Structure:**
```
apps/api/src/
apps/worker/src/
apps/web/src/
apps/landing/src/
packages/contracts/src/
packages/story-engine/src/
packages/recommendation/src/
packages/browser/src/
packages/ai/src/
packages/database/src/
packages/shared/src/
packages/config/src/
packages/auth/src/
packages/ui/src/
docs/
drizzle/
```

**Acceptance Criteria:**
- `bun install` resolves all workspace packages
- `bun run typecheck` passes on every package
- `bun run format` formats all files consistently
- `bun run lint` reports zero violations
- Docker Compose starts PostgreSQL successfully

**Dependencies:** None

**Complexity:** Low

---

## Milestone 2: Tooling

**Goal:** Configure development tooling for consistent code quality across the entire repository.

**Deliverables:**
- `biome.json` configuration (format on save, import sorting, no unused vars)
- Husky hooks with `lint-staged` for pre-commit checks
- Vitest configuration with workspace support
- Vite configuration for `web` and `api` apps
- Drizzle Kit configuration for migration generation
- Scripts in root `package.json`:
  - `dev` — run all apps
  - `dev:api`, `dev:worker`, `dev:web`, `dev:landing`
  - `build` — build all apps
  - `test` — run all tests
  - `test:watch` — watch mode
  - `lint` — Biome lint
  - `format` — Biome format
  - `typecheck` — TypeScript compiler check
  - `db:generate` — generate Drizzle migrations
  - `db:migrate` — apply Drizzle migrations
  - `clean` — remove all build artifacts

**Acceptance Criteria:**
- All scripts execute without errors
- Husky hooks prevent commits with lint errors
- `lint-staged` formats only staged files
- Vitest discovers and runs tests across all packages
- Drizzle Kit connects to local PostgreSQL

**Dependencies:** Milestone 1

**Complexity:** Low

---

## Milestone 3: Shared Contracts

**Goal:** Define every shared type, schema, DTO, and event that packages and applications will exchange.

**Deliverables:**

### `packages/contracts/src/story.ts`
```typescript
// Story, StoryStatus, StorySummary, CreateStoryInput, UpdateStoryInput
```

### `packages/contracts/src/evidence.ts`
```typescript
// Evidence, RawDocument, EvidenceSource, EvidenceMetadata
```

### `packages/contracts/src/entity.ts`
```typescript
// Entity, EntityType, EntityLink
```

### `packages/contracts/src/relationship.ts`
```typescript
// Relationship, RelationType
```

### `packages/contracts/src/user.ts`
```typescript
// User, CreateUserInput, UpdateUserInput
```

### `packages/contracts/src/interest.ts`
```typescript
// Interest, InterestTopic, InterestScore
```

### `packages/contracts/src/interaction.ts`
```typescript
// Interaction, InteractionType, CreateInteractionInput
```

### `packages/contracts/src/bookmark.ts`
```typescript
// Bookmark, CreateBookmarkInput
```

### `packages/contracts/src/job.ts`
```typescript
// Job, JobType, JobStatus, JobPayload
```

### `packages/contracts/src/feed.ts`
```typescript
// FeedItem, Feed, FeedOptions
```

### `packages/contracts/src/events.ts`
```typescript
// WericEvent union type with all event types:
// StoryCreated, StoryUpdated, StoryMerged,
// EvidenceDiscovered, UserBookmarked, UserReadStory,
// UserIgnoredStory, RecommendationGenerated
```

### `packages/contracts/src/index.ts`
Barrel export of all public types.

**Design Requirements:**
- All types defined as Zod schemas with inferred TypeScript types
- All types use `z.infer<typeof X>` pattern for dual validation and type inference
- Events are discriminated unions with a `type` discriminant
- DTOs are plain objects with no class instances
- Readonly arrays and objects where applicable

**Acceptance Criteria:**
- Every type has a corresponding Zod schema
- Every schema has at least basic validation rules
- Event types compile as discriminated unions
- `bun run typecheck` passes in the contracts package
- No dependency on any framework package

**Dependencies:** Milestones 1, 2

**Complexity:** Medium

---

## Milestone 4: Database

**Goal:** Create the PostgreSQL schema, Drizzle configuration, and migration workflow.

**Deliverables:**

### `drizzle/schema.ts`
Drizzle table definitions matching the specification:
- `stories` — with all fields, indexes, and constraints
- `evidence` — with unique URL constraint, JSONB metadata
- `storyEvidence` — join table with foreign keys
- `entities` — with name, type, aliases JSONB
- `storyEntities` — join table
- `relationships` — entity relationship graph
- `users` — with unique email and username
- `interests` — with user reference and score
- `interactions` — with user and story references
- `bookmarks` — with unique user+story constraint
- `jobs` — with status, type, payload JSONB

### `drizzle/index.ts`
Re-export all table definitions and utility types.

### `packages/database/src/config.ts`
Database connection configuration using `config` package.

### `drizzle.config.ts`
Drizzle Kit configuration for migration generation.

### Initial Migration
First migration that creates all tables with indexes.

**Acceptance Criteria:**
- All tables defined with correct types and constraints
- All foreign key relationships established
- `bun run db:generate` produces valid SQL
- `bun run db:migrate` applies schema to local PostgreSQL
- Tables can be queried via Drizzle
- No business logic in schema files

**Dependencies:** Milestones 1, 2, 3

**Complexity:** Medium

---

## Milestone 5: Repository Layer

**Goal:** Implement all database repository classes with strict persistence-only semantics.

**Deliverables:**

### `packages/database/src/repositories/story.repository.ts`
- `create(data: CreateStoryInput) → Effect<Story, RepositoryError>`
- `findById(id: string) → Effect<Story | null, RepositoryError>`
- `findBySlug(slug: string) → Effect<Story | null, RepositoryError>`
- `findMany(options: QueryOptions) → Effect<Story[], RepositoryError>`
- `update(id: string, data: UpdateStoryInput) → Effect<Story, RepositoryError>`
- `delete(id: string) → Effect<void, RepositoryError>`

### `packages/database/src/repositories/evidence.repository.ts`
- `create(data: RawEvidence) → Effect<Evidence, RepositoryError>`
- `findById(id: string) → Effect<Evidence | null, RepositoryError>`
- `findByUrl(url: string) → Effect<Evidence | null, RepositoryError>`
- `findBySource(source: string) → Effect<Evidence[], RepositoryError>`
- `findMany(options: QueryOptions) → Effect<Evidence[], RepositoryError>`

### `packages/database/src/repositories/entity.repository.ts`
- `create(data: CreateEntityInput) → Effect<Entity, RepositoryError>`
- `findByName(name: string) → Effect<Entity | null, RepositoryError>`
- `findByType(type: string) → Effect<Entity[], RepositoryError>`
- `linkToStory(storyId: string, entityId: string) → Effect<void, RepositoryError>`

### `packages/database/src/repositories/relationship.repository.ts`
- `create(data: CreateRelationshipInput) → Effect<Relationship, RepositoryError>`
- `findByEntity(entityId: string) → Effect<Relationship[], RepositoryError>`

### `packages/database/src/repositories/user.repository.ts`
- `create(data: CreateUserInput) → Effect<User, RepositoryError>`
- `findById(id: string) → Effect<User | null, RepositoryError>`
- `findByEmail(email: string) → Effect<User | null, RepositoryError>`
- `update(id: string, data: UpdateUserInput) → Effect<User, RepositoryError>`

### `packages/database/src/repositories/interaction.repository.ts`
- `create(data: CreateInteractionInput) → Effect<Interaction, RepositoryError>`
- `findByUser(userId: string) → Effect<Interaction[], RepositoryError>`
- `findByStory(storyId: string) → Effect<Interaction[], RepositoryError>`
- `aggregateByType(userId: string) → Effect<InteractionAggregate[], RepositoryError>`

### `packages/database/src/repositories/bookmark.repository.ts`
- `create(userId: string, storyId: string) → Effect<Bookmark, RepositoryError>`
- `findByUser(userId: string) → Effect<Bookmark[], RepositoryError>`
- `delete(userId: string, storyId: string) → Effect<void, RepositoryError>`
- `exists(userId: string, storyId: string) → Effect<boolean, RepositoryError>`

### `packages/database/src/repositories/job.repository.ts`
- `create(data: CreateJobInput) → Effect<Job, RepositoryError>`
- `findPending() → Effect<Job[], RepositoryError>`
- `updateStatus(id: string, status: JobStatus) → Effect<void, RepositoryError>`
- `incrementRetries(id: string) → Effect<void, RepositoryError>`

### `packages/database/src/repositories/index.ts`
Barrel export of all repositories.

### `packages/database/src/index.ts`
Public API: repository exports only. No Drizzle types.

**Design Requirements:**
- Each repository accepts `DrizzleDB` instance via dependency injection (Effect Layer)
- Repository methods return domain types from `contracts`, never Drizzle types
- Repository methods perform persistence only — no business logic, no validation (input assumed valid)
- Every public method returns `Effect<A, RepositoryError>`
- `RepositoryError` is a tagged union with typed error variants (NotFound, Conflict, ConnectionError)

**Acceptance Criteria:**
- Every repository method compiles and returns Effect types
- Repository methods can be called from Effect contexts
- Repository types use only `contracts` types in signatures
- No Drizzle types leak into return types
- Tests demonstrate CRUD operations with test database
- `RepositoryError` covers all database failure modes

**Dependencies:** Milestones 3, 4

**Complexity:** Medium

---

## Milestone 6: Effect Infrastructure

**Goal:** Establish Effect Service pattern, Layer composition, and shared infrastructure for all packages.

**Deliverables:**

### Shared Effect Patterns (`packages/shared/src/effect/`)
- `Effectful` — base utilities for Effect composition
- `TaggedError` — pattern for typed business errors
- `AppError` — union type of all application-level errors
- `withRetry` — retry strategy for transient failures
- `withTimeout` — timeout wrapper for Effect operations

### Layer Composition (`packages/shared/src/layer/`)
- `composeLayers` — utility for composing multiple production layers
- `createTestLayer` — utility for creating test layers from mock implementations

### LoggerService (`packages/shared/src/logger/`)
- `LoggerService` — Effect Tag for structured logging
- `PinoLoggerLayer` — production layer using Pino
- Log levels: trace, debug, info, warn, error, fatal
- Structured context support (requestId, jobId, userId)

### Database Layer (`packages/database/src/layer.ts`)
- `DrizzleDB` — Effect Tag for the database connection
- `DatabaseLiveLayer` — production layer with connection pool
- `DatabaseTestLayer` — test layer using in-memory or test database

### Repository Layer Composition
- `RepositoryLiveLayer` — composed layer providing all repository implementations
- `RepositoryTestLayer` — composed test layer with mock repositories

### Config Package (`packages/config/src/`)
- Config loaded from environment variables
- Validated with Zod schema at startup
- Typed config object with all application settings

**Acceptance Criteria:**
- LoggerService can be consumed by any Effect
- DatabaseLiveLayer provides a working Drizzle connection
- RepositoryLiveLayer composes all repositories correctly
- Test layers can replace production layers in tests
- Config validates on load and fails fast with clear errors
- All shared patterns compile and are reusable

**Dependencies:** Milestones 3, 5

**Complexity:** Medium

---

## Milestone 7: Story Engine

**Goal:** Implement the core knowledge generation pipeline that transforms raw evidence into coherent stories.

**Deliverables:**

### `packages/story-engine/src/normalizer.ts`
- `StoryNormalizer` — normalizes incoming evidence
- Deduplicates by URL
- Strips irrelevant content
- Extracts basic metadata (author, date, source)

### `packages/story-engine/src/matcher.ts`
- `StoryMatcher` — detects if evidence matches existing stories
- TF-IDF similarity scoring on title and content
- Entity overlap detection
- Returns match candidates with confidence scores

### `packages/story-engine/src/extractor.ts`
- `EntityExtractor` — extracts named entities from evidence
- Delegates to AI package for LLM-based extraction
- Stores entities and links to stories

### `packages/story-engine/src/merger.ts`
- `StoryMerger` — merges two stories into one
- Combines evidence lists
- Updates summary to reflect merged content
- Removes duplicate evidence

### `packages/story-engine/src/timeline.ts`
- `TimelineBuilder` — tracks story evolution over time
- Orders evidence chronologically
- Detects significant updates

### `packages/story-engine/src/service.ts`
- `StoryService` — Effect Service combining all components
- `ingest(evidence: RawEvidence[]) → Effect<Story[], StoryError>`
- `update(storyId: string, data: StoryUpdate) → Effect<Story, StoryError>`
- `merge(targetId: string, sourceId: string) → Effect<Story, StoryError>`
- `rebuild(storyId: string) → Effect<Story, StoryError>`

### `packages/story-engine/src/errors.ts`
- `StoryError` — tagged union of all story engine errors

### Pipeline Implementation
The full ingestion pipeline:
```
Normalize → Extract Entities → Detect Matches → Merge or Create → Update Timeline → Persist
```

### Tests
- Evidence deduplication
- Story creation from valid evidence
- Story merging
- Entity extraction integration
- Error handling (missing evidence, invalid input)
- Empty evidence list handling

**Acceptance Criteria:**
- `ingest()` creates stories with linked evidence
- `ingest()` detects and handles duplicates
- `merge()` combines stories correctly
- `EntityExtractor` produces typed entities
- `StoryError` covers all failure modes
- All operations return Effect types
- Pipeline executes in correct order
- Tests pass with repository test layer

**Dependencies:** Milestones 3, 5, 6

**Complexity:** High

---

## Milestone 8: Browser Package

**Goal:** Implement the internet access abstraction layer — the only package allowed to communicate with external websites.

**Deliverables:**

### `packages/browser/src/types.ts`
- `SearchQuery` — search parameters
- `SearchResult` — search result item
- `FetchResult` — fetched page content
- `ExtractedContent` — structured extracted content
- `BrowserError` — typed error union

### `packages/browser/src/search/index.ts`
- Search interface via configurable provider
- RSS feed fetching
- Generic web search (configurable provider)

### `packages/browser/src/fetch/index.ts`
- Page content fetching
- Content extraction (readability-based)
- Metadata extraction (Open Graph, Twitter Cards)

### `packages/browser/src/extract/index.ts`
- Content sanitization
- Structured document extraction
- Source-specific extractors (Hacker News, Reddit, GitHub)

### `packages/browser/src/service.ts`
- `BrowserService` — Effect Service
- `search(query: SearchQuery) → Effect<SearchResult[], BrowserError>`
- `fetch(url: string) → Effect<FetchResult, BrowserError>`
- `extract(url: string) → Effect<ExtractedContent, BrowserError>`

### `packages/browser/src/sources/`
- `rss.ts` — RSS feed parser
- `hackernews.ts` — HN API client
- `reddit.ts` — Reddit API client
- `github.ts` — GitHub API client
- `web.ts` — Generic web scraper

### Source Handlers
- RSS: Parse RSS/Atom feeds
- Hacker News: FN API for top stories, comments
- Reddit: JSON API for subreddit posts
- GitHub: API for trending repos, releases
- Web: Generic HTTP fetching with content extraction

### Tests
- Search execution
- URL fetching
- Content extraction
- Source-specific parsing
- Error handling (network errors, invalid URLs)
- Rate limiting awareness

**Acceptance Criteria:**
- All source handlers return structured `RawDocument` types
- Search returns typed results
- Fetch handles HTTP errors gracefully
- Extract produces structured content
- No raw HTML exposed outside Browser package
- Every public method returns Effect
- Tests mock external HTTP calls

**Dependencies:** Milestones 3, 6

**Complexity:** Medium

---

## Milestone 9: AI Package

**Goal:** Implement provider-agnostic AI abstraction with validation, summarization, entity extraction, and embeddings.

**Deliverables:**

### `packages/ai/src/provider.ts`
- `AIProvider` — interface for AI providers
- Provider-agnostic method signatures

### `packages/ai/src/providers/openai.ts`
- OpenAI implementation using Vercel AI SDK
- GPT-4/GPT-4o for summarization and extraction
- text-embedding-3-small for embeddings

### `packages/ai/src/providers/gemini.ts`
- Gemini implementation using Vercel AI SDK
- Gemini 1.5 Pro for reasoning tasks
- Gemini embedding for embeddings

### `packages/ai/src/providers/anthropic.ts`
- Anthropic implementation using Vercel AI SDK
- Claude 3.5 Sonnet for complex reasoning

### `packages/ai/src/service.ts`
- `AIService` — Effect Service
- `summarize(content: string, options?: SummarizeOptions) → Effect<Summary, AIError>`
- `classify(content: string, categories: string[]) → Effect<Classification, AIError>`
- `extractEntities(content: string) → Effect<Entity[], AIError>`
- `generateEmbeddings(text: string) → Effect<number[], AIError>`
- `structuredOutput<T>(prompt: string, schema: ZodSchema<T>) → Effect<T, AIError>`

### `packages/ai/src/validation.ts`
- Zod schemas for every AI output
- Validation of AI responses before returning to callers
- `ValidationError` for malformed AI responses

### `packages/ai/src/errors.ts`
- `AIError` — tagged union
- `ProviderError` — provider-specific failures
- `ValidationError` — response validation failures
- `RateLimitError` — rate limit exceeded
- `TimeoutError` — request timeout

### Provider Selection
- Configurable default provider
- Runtime provider selection
- Fallback chain on provider failure

### Tests
- Provider-agnostic service tests with mock provider
- Response validation
- Error handling for each provider
- Provider fallback behavior
- Validation of structured outputs

**Acceptance Criteria:**
- All four public methods return Effect types
- AI responses are validated against Zod schemas
- Provider selection is configurable
- Provider errors are typed and propagated
- No provider-specific types leak into business logic
- Mock provider enables deterministic testing

**Dependencies:** Milestones 3, 6

**Complexity:** Medium

---

## Milestone 10: Recommendation Engine

**Goal:** Implement story ranking, feed personalization, and interest learning.

**Deliverables:**

### `packages/recommendation/src/scorer.ts`
- `StoryScorer` — scores individual stories
- Freshness scoring (recency bonus)
- Quality scoring (evidence count, source diversity)
- Interest matching (topic affinity)
- Interaction history (read before penalty)

### `packages/recommendation/src/ranker.ts`
- `FeedRanker` — ranks scored stories
- Diversity promotion (entity diversity, source diversity)
- Recency mix (fresh + evergreen)
- Click-through rate prediction

### `packages/recommendation/src/diversifier.ts`
- `FeedDiversifier` — ensures feed diversity
- Entity diversity (avoid same-topic saturation)
- Source diversity (mix of sources)
- Content type diversity

### `packages/recommendation/src/interest.ts`
- `InterestLearner` — learns user interests
- Implicit feedback from interactions
- Topic extraction from read stories
- Interest score decay over time

### `packages/recommendation/src/service.ts`
- `RecommendationService` — Effect Service
- `generateFeed(userId: string, options: FeedOptions) → Effect<Feed, RecommendationError>`
- `updateInterests(userId: string, interaction: Interaction) → Effect<void, RecommendationError>`
- `scoreStory(storyId: string, userId: string) → Effect<number, RecommendationError>`

### `packages/recommendation/src/errors.ts`
- `RecommendationError` — tagged union

### Tests
- Feed generation with empty interests
- Feed generation with known interests
- Diversity constraints in feed output
- Interest update from interactions
- Score computation
- Edge cases (no stories, no user)

**Acceptance Criteria:**
- `generateFeed()` returns ranked, diversified story list
- `updateInterests()` modifies user interest scores
- `scoreStory()` returns a normalized score (0-1)
- Feed respects diversity constraints
- All operations return Effect types
- No story creation or persistence in recommendation

**Dependencies:** Milestones 3, 5, 6

**Complexity:** High

---

## Milestone 11: Worker

**Goal:** Implement the background job execution runtime with scheduled and ad-hoc jobs.

**Deliverables:**

### `apps/worker/src/runtime.ts`
- Effect-based job execution runtime
- Job queue polling
- Concurrent job execution with bounded parallelism
- Graceful shutdown

### `apps/worker/src/jobs/discover-stories.ts`
- Executes Agent Runtime with discovery tools
- Produces evidence, sends to Story Engine
- Scheduled: every 15 minutes

### `apps/worker/src/jobs/refresh-story.ts`
- Refreshes evidence for existing stories
- Checks for updates on original sources
- Scheduled: hourly for trending stories

### `apps/worker/src/jobs/rebuild-recommendations.ts`
- Recomputes recommendation scores for all users
- Scheduled: every 6 hours

### `apps/worker/src/jobs/cleanup-evidence.ts`
- Removes stale or low-quality evidence
- Maintains evidence retention policy
- Scheduled: daily

### `apps/worker/src/jobs/learn-interests.ts`
- Batch interest learning from recent interactions
- Scheduled: daily

### `apps/worker/src/jobs/recompute-scores.ts`
- Full score recomputation
- Scheduled: every 6 hours

### `apps/worker/src/index.ts`
- Application entry point
- Layer composition
- Scheduler registration
- Signal handling for graceful shutdown

### Job Conventions
- Every job is idempotent
- Every job emits structured logs with `jobId` and `jobType`
- Every job is retryable with exponential backoff
- Job failures emit typed errors, never throw

**Acceptance Criteria:**
- Worker starts and polls job queue
- Each job type executes correctly
- Jobs are retryable on transient failure
- Jobs emit structured logs
- Worker handles shutdown signals gracefully
- No HTTP endpoints exposed

**Dependencies:** Milestones 6, 7, 8, 9, 10

**Complexity:** Medium

---

## Milestone 12: API

**Goal:** Implement the HTTP API with authentication, routing, validation, and all endpoints.

**Deliverables:**

### `apps/api/src/index.ts`
- Hono application setup
- Layer composition
- Error handling middleware
- CORS, logging, request ID middleware

### `apps/api/src/middleware/auth.ts`
- JWT-based authentication middleware
- Token verification
- User context injection

### `apps/api/src/middleware/error.ts`
- Global error handler
- Maps typed errors to HTTP responses
- Structured error response format

### `apps/api/src/middleware/validation.ts`
- Request body validation using Zod
- Query parameter validation
- Path parameter validation

### `apps/api/src/routes/auth.ts`
- `POST /auth/register` — user registration
- `POST /auth/login` — user authentication

### `apps/api/src/routes/stories.ts`
- `GET /stories` — list stories
- `GET /stories/:slug` — get story by slug
- `POST /stories` — submit evidence (authenticated)

### `apps/api/src/routes/feed.ts`
- `GET /feed` — personalized feed (authenticated)

### `apps/api/src/routes/search.ts`
- `GET /search` — search stories and evidence

### `apps/api/src/routes/interactions.ts`
- `POST /interactions` — record interaction (authenticated)

### `apps/api/src/routes/bookmarks.ts`
- `GET /bookmarks` — list bookmarks (authenticated)
- `POST /bookmarks` — create bookmark (authenticated)
- `DELETE /bookmarks/:storyId` — delete bookmark (authenticated)

### `apps/api/src/routes/interests.ts`
- `GET /interests` — get user interests (authenticated)

### `apps/api/src/routes/health.ts`
- `GET /health` — health check

### Route Conventions
- Handlers validate input, call a service Effect, return a response
- Handlers never contain business logic
- Every handler is thin (validate → call → respond)

**Acceptance Criteria:**
- All endpoints return correct responses
- Authentication middleware works for protected routes
- Error handling returns consistent error format
- Zod validation returns clear validation errors
- Handlers never import database or AI packages directly
- API starts and responds to requests

**Dependencies:** Milestones 6, 7, 9, 10

**Complexity:** Medium

---

## Milestone 13: Frontend

**Goal:** Build the authenticated React frontend with feed, story, search, and user features.

**Deliverables:**

### `apps/web/src/routes/__root.tsx`
- Root layout with navigation

### `apps/web/src/routes/index.tsx`
- Feed page — personalized story feed

### `apps/web/src/routes/stories/$slug.tsx`
- Story detail page with evidence and entities

### `apps/web/src/routes/search.tsx`
- Search page with results

### `apps/web/src/routes/bookmarks.tsx`
- Bookmarks page

### `apps/web/src/routes/settings.tsx`
- User settings page

### `apps/web/src/components/`
- `StoryCard` — feed story card
- `StoryDetail` — full story view
- `EvidenceList` — evidence sources
- `EntityTag` — entity badge
- `SearchBar` — search input
- `FeedFilters` — filter controls
- `Pagination` — page navigation
- `Navigation` — app navigation
- `AuthGuard` — authentication wrapper

### `apps/web/src/hooks/`
- `useFeed` — TanStack Query hook for feed
- `useStory` — TanStack Query hook for story detail
- `useSearch` — TanStack Query hook for search
- `useBookmarks` — TanStack Query hook for bookmarks
- `useInteractions` — TanStack Query hook for interactions
- `useAuth` — authentication context hook

### `apps/web/src/lib/api.ts`
- API client with fetch wrapper
- Authentication header injection

### `apps/web/src/lib/auth.tsx`
- Auth context provider
- Token storage and refresh

### Design Conventions
- TailwindCSS for all styling
- shadcn/ui components (Button, Card, Input, Dialog, etc.)
- Lucide icons
- Responsive design (mobile-first)
- Dark mode support

**Acceptance Criteria:**
- Feed page displays personalized stories
- Story detail shows evidence and entities
- Search returns results from API
- Bookmarks work end-to-end
- Authentication flow works (login, register, logout)
- Responsive layout works on mobile and desktop
- Pages communicate only through API

**Dependencies:** Milestone 12

**Complexity:** Medium

---

## Milestone 14: Landing Page

**Goal:** Build the marketing website using Astro.

**Deliverables:**

### `apps/landing/src/pages/index.astro`
- Hero section with tagline
- Feature highlights
- Architecture overview
- Call to action

### `apps/landing/src/pages/about.astro`
- Project vision and mission
- Team information

### `apps/landing/src/pages/privacy.astro`
- Privacy policy

### Design
- Static site, no business logic
- TailwindCSS styling consistent with web app
- Responsive design
- Fast page loads (static generation)

**Acceptance Criteria:**
- Pages render correctly
- No JavaScript runtime required
- Styling matches web app design system
- Links to web app for authentication

**Dependencies:** None (independent)

**Complexity:** Low

---

## Milestone 15: Integration

**Goal:** Verify all applications and packages work together end-to-end.

**Deliverables:**
- End-to-end integration test: Discover → Story Engine → Feed → API → Web
- Cross-package integration tests
- Worker-to-API coordination tests
- Docker Compose setup for full local environment
- Smoke tests for each application

**Acceptance Criteria:**
- Full discovery flow works end-to-end
- Feed renders in the web app
- Authentication flow works end-to-end
- All apps start with single command
- Integration tests pass

**Dependencies:** Milestones 11, 12, 13, 14

**Complexity:** Medium

---

## Milestone 16: Testing

**Goal:** Ensure comprehensive test coverage across all packages and applications.

**Deliverables:**
- Unit tests for every package (target: >80% coverage)
- Integration tests for package interactions
- Effect Test usage for deterministic testing
- Test layer composition for every package
- Edge case coverage (empty inputs, error paths, concurrent access)

**Acceptance Criteria:**
- Every public service has tests
- Test layers exist for every package
- All tests pass consistently
- Coverage meets threshold

**Dependencies:** Milestones 3–14

**Complexity:** Medium

---

## Milestone 17: Documentation

**Goal:** Ensure all documentation is accurate, complete, and maintainable.

**Deliverables:**
- Package-level README files for every package
- JSDoc documentation for all public APIs
- Architecture decision records (ADRs) for significant decisions
- API usage examples
- Development setup guide verification

**Acceptance Criteria:**
- Every exported type has JSDoc
- Every package has a README
- Documentation accurately reflects the code
- New developer can set up project within 15 minutes

**Dependencies:** Milestones 3–14

**Complexity:** Low

---

## Milestone 18: Deployment

**Goal:** Prepare the platform for production deployment on Cloudflare.

**Deliverables:**
- Cloudflare Workers configuration for API
- Cloudflare Queues configuration for job scheduling
- Cloudflare R2 configuration for asset storage
- Cloudflare Cron Triggers for scheduled jobs
- Deployment scripts and CI/CD pipeline
- Environment-specific configuration
- Health check and monitoring setup

**Acceptance Criteria:**
- API deploys to Cloudflare Workers
- Worker deploys with queue and cron bindings
- Frontend deploys to Cloudflare Pages
- Landing page deploys independently
- Health checks pass in deployed environment

**Dependencies:** Milestones 11, 12, 13, 14, 15

**Complexity:** Low

---

## Completion Checklist

Verify all items before declaring v0.1 complete:

- [ ] Repository builds successfully (`bun run build`)
- [ ] Every application starts independently
- [ ] Every package owns a single responsibility
- [ ] Architecture follows the specification
- [ ] Effect is the backbone of business logic
- [ ] PostgreSQL schema exists with migrations
- [ ] Shared contracts exist with Zod schemas
- [ ] Story Engine exists with ingestion pipeline
- [ ] Recommendation Engine exists with feed generation
- [ ] Browser abstraction exists with search and fetch
- [ ] AI abstraction exists with provider abstraction
- [ ] Worker exists with scheduled job execution
- [ ] API exists with authentication and all endpoints
- [ ] Frontend exists with feed, story, search, bookmarks
- [ ] Landing page exists
- [ ] Documentation explains the architecture
- [ ] Codebase is understandable without reading implementation details
