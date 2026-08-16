## ADDED Requirements

### Requirement: Single config source for all apps

All apps (api, worker, web) SHALL use @weric/config as the single source of configuration. The duplicated validateEnv.ts in the API app SHALL be removed.

#### Scenario: API app loads config

- **WHEN** the API app starts
- **THEN** it loads configuration from @weric/config, including BETTER_AUTH_SECRET and BETTER_AUTH_URL

#### Scenario: Worker app loads config

- **WHEN** the worker app starts
- **THEN** it loads configuration from @weric/config

### Requirement: Config reads all required environment variables

The @weric/config package SHALL read all environment variables required by the platform: DATABASE_URL, API_PORT, JWT_SECRET (mapped to BETTER_AUTH_SECRET), BETTER_AUTH_URL, and GROQ_API_KEY.

#### Scenario: All env vars are set

- **WHEN** all required environment variables are set
- **THEN** config loads successfully with all values

#### Scenario: Required env var is missing

- **WHEN** a required environment variable (DATABASE_URL) is not set
- **THEN** config throws a descriptive error at startup

### Requirement: loadDatabaseConfig reads environment

The loadDatabaseConfig function SHALL read DATABASE_URL from process.env when no URL argument is provided, instead of defaulting to localhost.

#### Scenario: No URL argument provided, env var set

- **WHEN** loadDatabaseConfig is called with no arguments and DATABASE_URL is set
- **THEN** it returns a config using the DATABASE_URL value

#### Scenario: No URL argument provided, no env var

- **WHEN** loadDatabaseConfig is called with no arguments and DATABASE_URL is not set
- **THEN** it throws a descriptive error

#### Scenario: URL argument provided

- **WHEN** loadDatabaseConfig is called with an explicit URL string
- **THEN** it returns a config using that URL (existing behavior preserved)
