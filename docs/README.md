# Weric

**Internet Defragmentation Platform**

> Defragment the Internet.

Weric is an AI-native platform that transforms fragmented information from the internet into connected knowledge. Instead of presenting isolated posts, articles or tweets, Weric continuously discovers information, groups related evidence, constructs coherent stories, learns user interests, and delivers personalized context instead of endless feeds.

## Vision

Information is temporary. Knowledge is durable.

Every story should be supported by evidence. AI should reason, never hallucinate.

## Architecture

Weric consists of four independent applications connected through shared domain packages:

```
Internet
  → Browser Tool
    → Agent Runtime
      → Story Engine
        → PostgreSQL
          → Recommendation Engine
            → Feed
```

### Applications

| Application | Purpose                                                | Stack                 |
| ----------- | ------------------------------------------------------ | --------------------- |
| **api**     | HTTP interface, authentication, search, feeds, stories | Hono, Effect          |
| **worker**  | Scheduled jobs, agents, ingestion, maintenance         | Bun, Effect           |
| **web**     | Authenticated user interface                           | React, Vite, TanStack |
| **landing** | Marketing website                                      | Astro                 |

### Packages

| Package            | Responsibility                                                   |
| ------------------ | ---------------------------------------------------------------- |
| **contracts**      | Single source of truth — Zod schemas, DTOs, events, shared types |
| **story-engine**   | Knowledge generation, story creation, clustering, persistence    |
| **recommendation** | Ranking, personalization, feed generation                        |
| **browser**        | Internet access, searching, page extraction, scraping            |
| **ai**             | LLM abstraction, summarization, embeddings, structured outputs   |
| **database**       | Repositories, Drizzle, migrations                                |
| **shared**         | Pure utility functions                                           |
| **config**         | Configuration management                                         |
| **auth**           | Authentication logic                                             |
| **ui**             | Shared UI components                                             |

## Repository Layout

```
├── apps/
│   ├── api/          # HTTP interface
│   ├── worker/       # Background jobs
│   ├── web/          # React frontend
│   └── landing/      # Astro marketing site
├── packages/
│   ├── contracts/    # Shared schemas & types
│   ├── story-engine/ # Knowledge generation
│   ├── recommendation/ # Ranking & personalization
│   ├── browser/      # Internet access abstraction
│   ├── ai/           # LLM abstraction
│   ├── database/     # Drizzle & repositories
│   ├── shared/       # Pure utilities
│   ├── config/       # Configuration
│   ├── auth/         # Authentication
│   └── ui/           # Shared components
├── docs/             # Documentation
└── drizzle/          # Database migrations
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.2
- [PostgreSQL](https://postgresql.org) >= 16
- [Node.js](https://nodejs.org) >= 22 (for tooling)

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd weric

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env

# Start database
docker compose up -d postgres

# Run migrations
bun run migrate

# Start development
bun run dev
```

## Development Workflow

```bash
# Run all apps in development mode
bun run dev

# Run specific app
bun run dev:api
bun run dev:worker
bun run dev:web
bun run dev:landing

# Lint and format
bun run lint
bun run format

# Run tests
bun run test
bun run test:watch

# Build
bun run build
```

## Philosophy

- **Domain first, framework second.** Business logic is framework-independent. Frameworks are replaceable.
- **Packages communicate through interfaces.** No concrete coupling between packages.
- **Effect is the backbone of business logic.** Every business operation is represented as an Effect.
- **Story Engine owns knowledge.** Agent Runtime discovers. Recommendation Engine ranks. Repositories persist.
- **No hidden magic.** Explicitness over cleverness. Strong typing is mandatory.
- **Build bottom-up.** Infrastructure before orchestration. Contracts before implementation.
