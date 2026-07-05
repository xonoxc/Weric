# Contributing

## Getting Started

See [README.md](./README.md) for setup instructions.

## Development Workflow

### Branch Strategy

- `main` — production-ready code. Always deployable.
- `develop` — integration branch for features.
- `feat/<name>` — feature branches. Squash merge to `develop`.
- `fix/<name>` — bug fix branches.
- `docs/<name>` — documentation changes.

### Commits

Use [conventional commits](https://www.conventionalcommits.org/):

```
feat(story-engine): add evidence deduplication
fix(api): correct pagination offset calculation
docs(architecture): update data flow diagram
chore(deps): upgrade effect to 3.0.0
refactor(database): extract query builder
test(recommendation): add feed diversification tests
```

### Pull Request Process

1. Create a feature branch from `develop`.
2. Implement changes following the coding standards.
3. Write or update tests.
4. Ensure all quality gates pass:
   - `bun run typecheck` — no TypeScript errors
   - `bun run lint` — no lint violations
   - `bun run format` — code is formatted
   - `bun run test` — all tests pass
5. Open a pull request against `develop`.
6. Request review from at least one maintainer.
7. Squash merge after approval.

## Code Review

### Reviewer Expectations

- Verify package boundaries are respected.
- Verify no business logic leaks into infrastructure code.
- Verify types are expressive and correct.
- Verify Effects compose properly.
- Verify tests cover the intended behavior.
- Verify no hidden side effects.

### Author Expectations

- Keep PRs focused on a single concern.
- Provide context in the PR description.
- Respond to review feedback constructively.

## Quality Gates

Every change must pass before merging:

| Gate       | Command             | Description                 |
| ---------- | ------------------- | --------------------------- |
| TypeScript | `bun run typecheck` | No type errors              |
| Lint       | `bun run lint`      | No lint violations          |
| Format     | `bun run format`    | Consistent formatting       |
| Test       | `bun run test`      | All tests pass              |
| Build      | `bun run build`     | All apps build successfully |

## Package Guidelines

### Creating a New Package

1. Create the package directory under `packages/<name>`.
2. Set up `package.json` with `@weric/<name>` as the package name.
3. Configure `tsconfig.json` extending the root configuration.
4. Implement the package following the architecture specification.
5. Add a `README.md` explaining the package's responsibility.
6. Export public API through an `index.ts` barrel file.
7. Add tests under a `__tests__` directory.

### Package Conventions

- Each package has a single responsibility.
- Each package has a clear public API (barrel file).
- Internal implementation details are not exported.
- Dependencies between packages are explicit in `package.json`.
- Circular dependencies are forbidden.

## Environment

### Required Tools

| Tool                                 | Version | Purpose                               |
| ------------------------------------ | ------- | ------------------------------------- |
| [Bun](https://bun.sh)                | >= 1.2  | Runtime, package manager, test runner |
| [Node.js](https://nodejs.org)        | >= 22   | Tooling compatibility                 |
| [PostgreSQL](https://postgresql.org) | >= 16   | Database                              |
| [Docker](https://docker.com)         | Latest  | Local PostgreSQL                      |

### Environment Variables

See `.env.example` for the complete list of required variables.

Key variables:

```
DATABASE_URL=postgresql://localhost:5432/weric
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
```

## Need Help?

- Open a GitHub Discussion for questions.
- Open a GitHub Issue for bugs or feature requests.
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design.
- See [ENGINEERING.md](./ENGINEERING.md) for technology decisions.
