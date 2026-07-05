# Architecture

## High Level Architecture

Weric follows a **domain-driven, package-oriented architecture** with four independently deployable applications and ten shared packages.

The fundamental architectural principle is **strict package boundary enforcement** — every subsystem owns a specific responsibility and communicates through defined interfaces.

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Browser Package                            │
│  (search, fetch, extract, screenshot — structured documents) │
└────────────────────┬────────────────────────────────────────┘
                     │ RawDocument[]
┌────────────────────▼────────────────────────────────────────┐
│                     Agent Runtime                             │
│  (orchestrates tools, produces evidence, never persists)     │
└────────────────────┬────────────────────────────────────────┘
                     │ Evidence
┌────────────────────▼────────────────────────────────────────┐
│                     Story Engine                              │
│  (normalize, match, merge, cluster, summarize, persist)      │
└────────────────────┬────────────────────────────────────────┘
                     │ Stories
┌────────────────────▼────────────────────────────────────────┐
│                     PostgreSQL                                │
│  (canonical source of truth, immutable evidence)             │
└────────────────────┬────────────────────────────────────────┘
                     │ Stories + Interactions
┌────────────────────▼────────────────────────────────────────┐
│                Recommendation Engine                          │
│  (rank, personalize, diversify, generate feed)               │
└────────────────────┬────────────────────────────────────────┘
                     │ Feed
┌────────────────────▼────────────────────────────────────────┐
│                     API + Web                                 │
│  (HTTP interface, authenticated frontend)                    │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Discovery Flow

```
Scheduler → Job Queue → Worker → Agent Runtime
  → Browser (search/fetch) → RawDocument
  → Story Engine (normalize + match + merge)
  → Database (persist)
```

### Consumption Flow

```
User Request → API → Recommendation Engine
  → Database (read stories + interests)
  → Rank → Diversify → Feed
  → API Response → Web
```

### Feedback Flow

```
User Interaction → API → Database (interactions)
  → Worker (background) → Recommendation Engine (update interests)
  → Database (updated interests)
```

## Event Flow

Components communicate through events to maintain loose coupling.

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Story Engine │────▶│  Event Bus       │────▶│ Recommendation   │
└─────────────┘     └──────────────────┘     └──────────────────┘
     │                                                │
     │ Events:                                       │ Events:
     │ • StoryCreated                                │ • RecommendationGenerated
     │ • StoryUpdated                                │
     │ • StoryMerged                                 │
     │ • EvidenceDiscovered                          │
     └───────────────────────────────────────────────┘

┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ User Action  │────▶│  Event Bus       │────▶│  Worker          │
└─────────────┘     └──────────────────┘     └──────────────────┘
     │ Events:                                       │
     │ • UserBookmarked                              │
     │ • UserReadStory                               │
     │ • UserIgnoredStory                            │
```

## Package Dependency Graph

```
                    ┌──────────┐
                    │ shared   │ (pure utilities, no deps)
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │ contracts│ (schemas, DTOs, events, types)
                    └────┬─────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────▼─────┐  ┌─────▼─────┐  ┌────▼─────┐
    │   config  │  │ database  │  │    ai    │
    └─────┬─────┘  └─────┬─────┘  └────┬─────┘
          │              │              │
          └──────────┐   │   ┌──────────┘
                     │   │   │
               ┌─────▼───▼───▼──────┐
               │    story-engine    │
               └─────────┬──────────┘
                         │
               ┌─────────▼──────────┐
               │  recommendation    │
               └─────────┬──────────┘
                         │
               ┌─────────▼──────────┐
               │     browser        │
               └─────────┬──────────┘
                         │
                    ┌────▼─────┐
                    │   auth   │
                    └──────────┘
```

### Package Dependencies

| Package | Internal Dependencies |
|---|---|
| `shared` | None |
| `contracts` | `shared` |
| `config` | `shared` |
| `database` | `contracts`, `shared` |
| `ai` | `contracts`, `shared` |
| `browser` | `contracts`, `shared` |
| `story-engine` | `contracts`, `database`, `ai`, `shared` |
| `recommendation` | `contracts`, `database`, `shared` |
| `auth` | `contracts`, `database`, `shared` |
| `ui` | `contracts`, `shared` |

## Application Dependency Graph

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│    api    │     │  worker   │     │    web    │     │  landing  │
│ (Hono +   │     │ (Bun +    │     │ (React +  │     │  (Astro)  │
│  Effect)  │     │  Effect)  │     │  Vite)    │     │           │
└─────┬─────┘     └─────┬─────┘     └─────┬─────┘     └───────────┘
      │                 │                 │             (standalone)
      │                 │                 │
      └─────────────────┼─────────────────┘
                        │
              ┌─────────▼─────────┐
              │   Shared Packages │
              └───────────────────┘
```

### Application Dependencies

| Application | Depends On |
|---|---|
| `api` | `contracts`, `database`, `story-engine`, `recommendation`, `browser`, `ai`, `shared`, `config`, `auth` |
| `worker` | `contracts`, `database`, `story-engine`, `recommendation`, `browser`, `ai`, `shared`, `config` |
| `web` | `contracts`, `ui`, `shared` (communicates only through API) |
| `landing` | None (static site, independent deployment) |

## Domain Boundaries

### Story Engine Boundary

```
Owns:
  • Knowledge generation
  • Story creation and merging
  • Entity extraction
  • Evidence clustering
  • Timeline tracking
  • Persistence orchestration

Does Not Own:
  • Web searching (Browser)
  • Ranking (Recommendation)
  • User personalization (Recommendation)
  • Scheduling (Worker)
```

### Agent Runtime Boundary

```
Owns:
  • Tool orchestration
  • Discovery decisions
  • RawDocument production

Does Not Own:
  • Data persistence (Story Engine)
  • Story updates (Story Engine)
  • Feed generation (Recommendation)
```

### Recommendation Engine Boundary

```
Owns:
  • Story ranking
  • Feed personalization
  • Interest learning
  • Score computation

Does Not Own:
  • Story creation (Story Engine)
  • Story persistence (Story Engine)
  • Web searching (Browser)
  • AI reasoning (AI)
```

### Browser Boundary

```
Owns:
  • Internet access
  • Search execution
  • Page extraction
  • Scraping abstraction

Does Not Own:
  • Data persistence
  • Story creation
  • AI reasoning
  • User data
```

## Ownership Summary

| Subsystem | Owns | Must Not |
|---|---|---|
| Agent Runtime | Discovery, orchestration | Persist data |
| Story Engine | Knowledge, stories, clustering | Search the web |
| Recommendation Engine | Ranking, feed, interests | Create or persist stories |
| Repositories | Database persistence | Contain business logic |
| AI | LLM abstraction | Write to database |
| Browser | Internet access | Touch database |
| API | HTTP, auth, routing | Contain business logic |
| Worker | Background jobs | Expose HTTP endpoints |
| Web | Authenticated UI | Access database directly |
| Landing | Marketing content | Contain business logic |
