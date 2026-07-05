# Engineering Decisions

## Why Effect

Effect is the foundation of all backend business logic in Weric. Every business operation is represented as an Effect.

### Reasoning

1. **Composability.** Effects compose naturally through `pipe`, `map`, `flatMap`, and `zip`. Complex business workflows are expressed as pipelines of smaller Effects.

2. **Type-safe errors.** Effect provides `Either`, `Option`, and typed `Cause` for representing failures. Business errors are typed rather than thrown. This eliminates entire categories of runtime crashes.

3. **Dependency injection through Layers.** Every infrastructure dependency is provided through a `Layer`. Services depend on abstractions (interfaces/tags), not concrete implementations. Testing replaces production Layers with test Layers — no mocking frameworks, no monkey patching.

4. **Structured concurrency.** Effect provides `Fiber`, `Scope`, and `ForkScope` for safe, leak-free concurrent operations. The worker application runs multiple agents concurrently without resource leaks.

5. **Deterministic testing.** Effect's `TestClock`, `TestRandom`, and `TestServices` enable deterministic testing of time-dependent and non-deterministic code.

6. **No hidden magic.** Effect is a library, not a framework. It does not hijack control flow. It does not require decorators. It does not rely on runtime reflection.

### Conventions

- Business operations return `Effect<A, E, R>`
- Infrastructure dependencies are represented as `Layer`s
- Pure computations remain pure (no Effect for trivial utilities)
- Side effects live at application boundaries
- Entry points (API routes, worker jobs, tests) execute Effects via `runPromise` or `runFork`
- Only entry points call `runPromise` directly

```
// Business logic returns Effect
const processEvidence = (evidence: Evidence): Effect<Story, StoryError, StoryEngineDeps> =>
  StoryService.ingest(evidence);

// Entry point executes Effect
app.post("/api/stories", async (c) => {
  const result = await Effect.runPromise(
    processEvidence(evidence).pipe(
      Effect.provide(StoryEngineLiveLayer)
    )
  );
  return c.json(result);
});
```

## Why Hono

Hono is the HTTP framework for the `api` application.

### Reasoning

1. **Minimal and lightweight.** Hono is a ~14KB framework with no kitchen sink. It does exactly what an HTTP framework should do — routing, middleware, and response handling — and nothing more.

2. **Framework-agnostic business logic.** Hono's thin handler pattern makes it impossible to accidentally leak business logic into HTTP handlers. Request validation → call service → return response. That is the complete scope of an Hono handler.

3. **Web-standard compatible.** Hono supports `Request`/`Response` standards, making it deployable on Cloudflare Workers, Bun, Deno, and Node.js without adapter code.

4. **Effect compatible.** Hono handlers return `Response | Promise<Response>`, which makes them trivial to call `Effect.runPromise` from. No framework-specific Effect integration needed.

5. **Replaceable.** If Hono becomes a limitation, the thin handler pattern means migration is isolated to the `apps/api` directory. Business logic in packages remains untouched.

### Conventions

- Handlers validate input, call a service Effect, return a response
- Handlers never contain business logic
- Handlers never import database packages directly
- Handlers never call AI directly

## Why PostgreSQL

PostgreSQL is the canonical source of truth for Weric.

### Reasoning

1. **JSONB for flexible metadata.** Evidence metadata, AI outputs, and configuration are naturally semi-structured. PostgreSQL's JSONB provides indexing and querying over flexible schemas without requiring a separate document database.

2. **ACID compliance.** Stories referencing evidence, entities connected to stories — these relationships must remain consistent. PostgreSQL guarantees transactional integrity.

3. **Maturity and ecosystem.** PostgreSQL has decades of proven reliability, a rich extension ecosystem, and excellent tooling. NoSQL databases trade consistency for performance that Weric does not need.

4. **Single database principle.** A single PostgreSQL instance is sufficient until proven otherwise. Premature introduction of Redis, message brokers, or specialized databases adds operational complexity without measurable benefit.

5. **Full-text search.** PostgreSQL's `tsvector` provides adequate search capabilities without requiring a dedicated search engine in early versions.

### Performance Rule

> Do not optimize without evidence. PostgreSQL is sufficient until proven otherwise.

## Why Drizzle

Drizzle is the ORM for database access in Weric.

### Reasoning

1. **Type-safe SQL.** Drizzle generates TypeScript types directly from schema definitions. Every query is type-checked at compile time. No runtime query builders, no raw SQL strings.

2. **Zero abstraction.** Drizzle does not hide SQL. A Drizzle query maps closely to the equivalent SQL. This makes it easy to understand what the database will actually execute.

3. **Framework independent.** Drizzle is a library, not a framework. It does not require extending base classes, registering entities, or using decorators. This aligns with the "frameworks are replaceable" principle.

4. **Migration generation.** Drizzle Kit generates SQL migrations from schema changes, providing a clean migration workflow without lock-in.

5. **Repository encapsulation.** Drizzle is never exposed outside the `database` package. The `StoryRepository` class accepts a Drizzle instance through its constructor. Public methods return domain types from `contracts`, never Drizzle types.

### Conventions

- Drizzle is used only inside `packages/database`
- Repository methods return domain types (from `contracts`)
- Repository methods never expose `drizzle-orm` types in their signatures
- Business logic never imports from `drizzle-orm`

## Why Domain Driven Design

### Reasoning

1. **Ubiquitous language.** The domain concepts — Story, Evidence, Entity, Interest, Feed — mean the same thing everywhere in the codebase. A developer reading `StoryService.ingest()` understands exactly what it does without additional context.

2. **Bounded contexts.** Story Engine, Recommendation Engine, Agent Runtime, Browser — each is a bounded context with its own model of the world. DDD provides the vocabulary for defining these boundaries and the contracts between them.

3. **Persistence ignorance.** Domain models do not know about PostgreSQL, Drizzle, or any infrastructure concern. This makes them testable, replaceable, and independent of technology choices.

4. **Package boundaries map to bounded contexts.** Each package in `packages/` corresponds to a bounded context. This is not accidental — the directory structure reflects the domain model.

## Why Package Boundaries Exist

Package boundaries are the most important architectural decision in Weric. They exist to:

1. **Prevent coupling.** If `Browser` could write to the database, the clean discovery flow becomes an unmaintainable tangle of responsibilities.

2. **Enable independent testing.** Each package can be tested in isolation with its dependencies replaced by test implementations.

3. **Force explicit contracts.** Packages communicate through defined interfaces. Changing how two packages interact requires changing a contract, not just calling a different method.

4. **Maintain replaceability.** If the AI provider changes from OpenAI to Anthropic, only the `ai` package is affected. If PostgreSQL becomes a bottleneck, only the `database` package is affected.

5. **Protect business logic.** Business logic lives in domain packages (`story-engine`, `recommendation`). It is never accidentally duplicated in HTTP handlers or database repositories.

## Why Story Engine Owns Persistence

The Story Engine is the **knowledge layer** of Weric. It is the only component that understands the semantics of what should be persisted, how stories relate to evidence, and when merging is appropriate.

Giving persistence ownership to the Story Engine means:

1. **Knowledge integrity is guaranteed.** The same component that creates stories ensures they are stored correctly.
2. **Transactions span knowledge operations.** A story creation and its evidence associations happen in a single transaction.
3. **No other component can corrupt stored knowledge.** Agent Runtime does not have access to database repositories. Recommendation Engine reads through read-only interfaces.

## Why Agent Runtime Never Owns Persistence

The Agent Runtime is an **orchestrator**. Its job is to decide what to do, execute tools, and produce raw output.

If the Agent Runtime persisted data:

1. **It would own knowledge it does not understand.** The Agent Runtime does not understand story semantics, entity relationships, or evidence quality.
2. **Side effects would leak into orchestration.** The Agent Runtime's purpose is discovery. Persistence is a separate concern.
3. **Testing becomes harder.** Stateless agents are trivial to test. Agents that persist data require database setup for every test.

## Technology Choices Summary

| Decision           | Choice               | Rationale                                                               |
| ------------------ | -------------------- | ----------------------------------------------------------------------- |
| Runtime            | Bun                  | Fast native TypeScript execution, built-in test runner, package manager |
| Backend framework  | Hono                 | Minimal, web-standard, framework-agnostic business logic                |
| Effect system      | Effect               | Composable, type-safe, layered DI, structured concurrency               |
| ORM                | Drizzle              | Type-safe SQL, zero abstraction, framework-independent                  |
| Database           | PostgreSQL           | ACID, JSONB, full-text search, single-database principle                |
| Frontend framework | React                | Mature ecosystem, component model                                       |
| Bundler            | Vite                 | Fast HMR, first-class TypeScript support                                |
| Router             | TanStack Router      | Type-safe routing, file-based routes                                    |
| Query client       | TanStack Query       | Server state management, caching, mutations                             |
| Forms              | React Hook Form      | Performant, minimal re-renders                                          |
| Validation         | Zod                  | Runtime type validation, TypeScript inference                           |
| Styling            | TailwindCSS          | Utility-first, consistent design system                                 |
| Components         | shadcn/ui            | Accessible, customizable, not a component library                       |
| Icons              | Lucide               | Consistent, tree-shakeable icon set                                     |
| AI SDK             | Vercel AI SDK        | Provider-agnostic, streaming support                                    |
| Cloud provider     | Cloudflare           | Workers, Queues, Cron, R2                                               |
| Formatter          | Biome                | Fast, single-tool formatting and linting                                |
| Testing            | Vitest + Effect Test | Fast, native ESM, Effect integration                                    |
| Git hooks          | Husky                | Enforce quality gates before commits                                    |
