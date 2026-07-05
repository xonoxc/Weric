# Weric

**Internet Defragmentation Platform**

> Defragment the Internet.

Weric is an AI-native platform that transforms fragmented information from the internet into connected knowledge.

## Repository Layout

```
├── apps/
│   ├── api/          # HTTP interface (Hono + Effect)
│   ├── worker/       # Background jobs (Bun + Effect)
│   ├── web/          # React frontend (Vite + TanStack)
│   └── landing/      # Marketing site (Astro)
├── packages/
│   ├── contracts/    # Zod schemas, DTOs, events, shared types
│   ├── story-engine/ # Knowledge generation, story creation
│   ├── recommendation/ # Ranking, personalization, feed
│   ├── browser/      # Internet access abstraction
│   ├── ai/           # LLM abstraction
│   ├── database/     # Drizzle ORM, repositories, migrations
│   ├── shared/       # Pure utility functions
│   ├── config/       # Configuration management
│   ├── auth/         # Authentication logic
│   └── ui/           # Shared React components
├── docs/             # Architecture and planning docs
└── drizzle/          # Database migrations
```

## Getting Started

```bash
bun install
docker compose up -d postgres
bun run db:migrate
bun run dev
```

## Documentation

See [docs/README.md](./docs/README.md) for the full architecture guide.
