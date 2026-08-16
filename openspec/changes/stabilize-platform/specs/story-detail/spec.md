## ADDED Requirements

### Requirement: Story detail route displays full story

The system SHALL provide a route at `/:slug` that displays the full story content, its evidence items, and its entities. The route SHALL fetch story detail from the existing GET /api/stories/:slug endpoint.

#### Scenario: User navigates to story detail

- **WHEN** a user clicks a story card or navigates to `/:slug`
- **THEN** the system loads and displays the story's full content, evidence list, and entity list

#### Scenario: Story not found

- **WHEN** a user navigates to `/:slug` for a story that does not exist
- **THEN** the system displays a "Story not found" message

#### Scenario: Story detail loads with evidence

- **WHEN** the story detail page renders for a story with 3 evidence items
- **THEN** all 3 evidence items are displayed with their source URLs and summaries

### Requirement: Story detail shows entities

The story detail view SHALL display all entities associated with the story, categorized by type (person, organization, location, concept).

#### Scenario: Story has mixed entity types

- **WHEN** the story detail page renders for a story with entities of types ["person", "organization", "location"]
- **THEN** entities are grouped by type with labels showing each category

### Requirement: Story expand in feed navigates to detail

When a user clicks the expand action on a StoryCard in the feed, the system SHALL navigate to the story detail route instead of logging to console.

#### Scenario: User expands a story card

- **WHEN** a user clicks the expand button on a StoryCard
- **THEN** the browser navigates to `/:slug` for that story
