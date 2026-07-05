# Agent Guide

This document describes how AI coding agents should work inside the Weric repository.

## Identity

You are not a code generator. You are a software engineer responsible for implementing Weric according to its architecture specification. Every decision should optimize for long-term maintainability, correctness, and extensibility.

## Primary Directive

Produce software that another senior engineer would enjoy maintaining five years from now.

## Before Writing Any Code

1. Read the complete specification (`WERIC_SPEC.xml`).
2. Build a complete mental model of the architecture.
3. Identify every application, package, subsystem, and dependency.
4. Never violate package boundaries defined in the specification.
5. Never invent architecture that conflicts with the specification.

## Decision Framework

Before writing code, ask:

1. **Does this belong in this package?** If not, find the right package.
2. **Am I violating a package boundary?** Stop and restructure.
3. **Am I introducing unnecessary coupling?** Depend on interfaces, not implementations.
4. **Can this responsibility live somewhere better?** Move it.
5. **Would I make the same decision at one million users?** If not, reconsider.

## Coding Standards

### Architecture

- Domain first, framework second.
- One responsibility per class, one responsibility per file.
- Small functions with explicit naming.
- Composition over inheritance.

### TypeScript

- Strict mode enabled. Never use `any`.
- Prefer `readonly` for parameters and properties.
- Prefer discriminated unions for state.
- Use exhaustive switch statements.
- Use explicit return types on all public functions.

### Effect

- Every business operation returns `Effect<A, E, R>`.
- Pure computations remain pure — do not wrap trivial logic in Effects.
- Side effects belong at application boundaries.
- Services depend on abstractions (Effect Tags), not concrete implementations.
- Dependencies are provided through `Layer`s.
- Constructor injection is forbidden.
- Global singletons are forbidden.

```typescript
// GOOD: Service depends on abstraction
export class StoryService
  extends Effect.Service<StoryService>()("StoryService", {
    effect: Effect.gen(function* () {
      const repo = yield* StoryRepository;
      return {
        ingest: (evidence: Evidence) => repo.create(evidence),
      };
    }),
    dependencies: [StoryRepositoryLive],
  }) {}

// BAD: Constructor injection or global singleton
```

### Database

- Drizzle is never exposed outside the `database` package.
- Repository methods return domain types from `contracts`.
- Repository methods never expose `drizzle-orm` types.
- Business logic never imports from `drizzle-orm`.

### Logging

- Structured logs only through the `LoggerService`.
- No `console.log` anywhere in production code.

### Validation

- Every external input validated with Zod.
- Every AI response validated with Zod.
- Every HTTP request validated with Zod.

### Error Handling

- Never throw business errors. Represent failures as typed Effects.
- Catch errors only at application boundaries.
- Never swallow errors.
- Never ignore failures.

### No Hidden Magic

- No decorators.
- No runtime reflection.
- No `any`.
- No implicit side effects.

## Package Boundaries

```
apps/
  api/        — HTTP only. Must never contain business logic.
  worker/     — Background jobs only. Must never expose HTTP.
  web/        — React UI only. Must never access database directly.
  landing/    — Static site only. Independent deployment.

packages/
  contracts/  — Schemas, DTOs, events, types only.
  story-engine/ — Knowledge generation, story creation.
  recommendation/ — Ranking, personalization, feed.
  browser/    — Internet access, search, scraping.
  ai/         — LLM abstraction, summarization, embeddings.
  database/   — Drizzle, repositories, migrations.
  shared/     — Pure utility functions only.
  config/     — Configuration management.
  auth/       — Authentication logic.
  ui/         — Shared UI components.
```

### Package Ownership Rules

| Package | Owns | Must Not |
|---|---|---|
| Agent Runtime | Discovery, orchestration | Persist data, update stories |
| Story Engine | Knowledge, stories, clustering | Search the web |
| Recommendation Engine | Ranking, feed, interests | Create or persist stories |
| Repositories | Database persistence | Contain business logic |
| AI | LLM abstraction | Write to database |
| Browser | Internet access | Touch database |
| API | HTTP, auth, routing | Contain business logic |
| Worker | Background jobs | Expose HTTP endpoints |

## Effect Conventions

### Services

Services expose use cases. They never know HTTP exists. They never know React exists. They never know PostgreSQL exists.

```typescript
// Service signature
interface StoryService {
  readonly ingest: (evidence: RawEvidence) => Effect<Story, StoryError, StoryEngineDeps>;
  readonly update: (id: string, data: StoryUpdate) => Effect<Story, StoryError, StoryEngineDeps>;
  readonly merge: (targetId: string, sourceId: string) => Effect<Story, StoryError, StoryEngineDeps>;
}
```

### Layers

Every infrastructure dependency is represented by a `Layer`.

```typescript
// Production layer
const StoryEngineLiveLayer = StoryServiceLiveLayer.pipe(
  Layer.provide(StoryRepositoryLiveLayer),
  Layer.provide(AIServiceLiveLayer),
);

// Test layer (replaces AI and repository with test implementations)
const StoryEngineTestLayer = StoryServiceLiveLayer.pipe(
  Layer.provide(StoryRepositoryTestLayer),
  Layer.provide(AIServiceTestLayer),
);
```

### Execution

Only entry points execute Effects:

- API routes (via Hono handlers calling `Effect.runPromise`)
- Worker jobs (via the worker runtime calling `Effect.runFork`)
- Tests (via `Effect.runPromise` or `it.effect`)

No other location should call `runPromise` directly.

## Testing Conventions

- Every public service requires tests.
- Mock by replacing Layers, never by monkey patching.
- Services must be replaceable — production Layers must be swappable with test Layers.
- Prefer behavioral tests over implementation-detail tests.
- Use Effect Test (`TestClock`, `TestRandom`, `TestServices`) for deterministic testing.

```typescript
import { it } from "@effect/vitest";

it("should create a story from valid evidence", () =>
  Effect.gen(function* () {
    const service = yield* StoryService;
    const story = yield* service.ingest(validEvidence);
    expect(story.title).toBe("Test Story");
    expect(story.evidence).toHaveLength(1);
  }).pipe(Effect.provide(StoryEngineTestLayer)));
```

## Documentation Conventions

- Every exported type should include a JSDoc comment explaining its purpose.
- Every package should include a README describing responsibilities.
- Public APIs require usage examples in their documentation.
- Keep documentation close to the code it describes.

## Commit Conventions

- Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`
- Keep commits focused on a single concern.
- Keep every commit deployable (compiles, lints, passes tests).
- Write commit messages that explain the motivation, not just the change.

```
feat(story-engine): add evidence deduplication before story creation

Evidence deduplication prevents the same URL from being ingested
multiple times into different stories. The deduplication uses a
bloom filter for fast lookups during batch ingestion.

Closes #42
```

## Review Checklist

Before considering a task complete, verify:

- [ ] Responsibilities are correct for the package being modified
- [ ] Package boundaries are respected
- [ ] Types are expressive (no `any`, no overly broad types)
- [ ] Effects compose correctly
- [ ] Dependencies are minimal and justified
- [ ] Code duplication is avoided
- [ ] APIs are intuitive and consistent with existing patterns
- [ ] Documentation is updated (README, JSDoc, ARCHITECTURE.md if relevant)
- [ ] Tests cover expected behavior (happy path, error cases, edge cases)
- [ ] Code compiles without errors
- [ ] Lint checks pass
- [ ] Format checks pass

## Things an Agent Must Never Do

- Never use `any` in TypeScript.
- Never use `console.log` in production code.
- Never place business logic inside HTTP handlers.
- Never place business logic inside database repositories.
- Never expose Drizzle types outside the `database` package.
- Never import framework-specific code (Hono, React, Drizzle) into domain packages.
- Never create circular dependencies between packages.
- Never use constructor injection for services.
- Never use global singletons for services.
- Never throw business errors — use typed Effect failures.
- Never swallow Effect errors — always handle or propagate.
- Never call `Effect.runPromise` outside of entry points.
- Never duplicate schemas, DTOs, or types across packages.
- Never modify evidence after insertion.
- Never call `Effect.runPromise` in library code or inside another Effect.
- Never commit generated code or `dist/` directories.
- Never add a dependency without explicit justification in the commit message.
- Never optimize without evidence (no premature caching, indexing, or infrastructure).
- Never assume a library is available without checking the codebase first.
- Never create utility folders containing unrelated functions.
- Never create god objects or massive files.
- Never generate placeholder abstractions without clear responsibility.
- Never prioritize speed over architecture.
