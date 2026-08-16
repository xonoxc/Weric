## ADDED Requirements

### Requirement: Onboarding saves user interests

The system SHALL persist topics selected during onboarding as user interests. When a user completes onboarding and selects topics, the system SHALL create or update interest records for that user with the selected topics.

#### Scenario: User completes onboarding with topics

- **WHEN** an authenticated user submits onboarding selections with topics ["Technology", "Science", "AI"]
- **THEN** the system creates interest records for that user with those topics and default scores

#### Scenario: User completes onboarding with no topics

- **WHEN** an authenticated user completes onboarding without selecting any topics
- **THEN** the system creates no interest records and navigates to home

#### Scenario: Unauthenticated user completes onboarding

- **WHEN** an unauthenticated user attempts to submit onboarding selections
- **THEN** the system returns a 401 error and does not save interests

### Requirement: Onboarding API accepts topic list

The POST /api/interests endpoint SHALL accept a JSON body with a `topics` array of strings. Each topic SHALL be stored as an interest record for the authenticated user with a default score of 1.0.

#### Scenario: Valid topics submitted

- **WHEN** POST /api/interests receives body `{ "topics": ["Rust", "WebAssembly"] }` from an authenticated user
- **THEN** the system returns 201 with the created interests and stores them in the database

#### Scenario: Empty topics array

- **WHEN** POST /api/interests receives body `{ "topics": [] }` from an authenticated user
- **THEN** the system returns 200 with an empty array and creates no records

#### Scenario: Duplicate topics submitted

- **WHEN** POST /api/interests receives body `{ "topics": ["Rust", "Rust"] }` from an authenticated user
- **THEN** the system deduplicates and creates a single interest record for "Rust"
