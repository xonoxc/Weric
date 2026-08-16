## ADDED Requirements

### Requirement: Bookmark toggle persists to API

When a user clicks the bookmark button on a StoryCard, the system SHALL send a request to the API to toggle the bookmark state for that story. The UI SHALL optimistically update the bookmark icon and revert if the API call fails.

#### Scenario: User bookmarks a story

- **WHEN** an authenticated user clicks the bookmark button on an unbookmarked story
- **THEN** the UI shows the bookmarked state immediately and sends a toggle request to the API

#### Scenario: User unbookmarks a story

- **WHEN** an authenticated user clicks the bookmark button on a bookmarked story
- **THEN** the UI shows the unbookmarked state immediately and sends a toggle request to the API

#### Scenario: API call fails

- **WHEN** the bookmark toggle API call returns an error
- **THEN** the UI reverts to the previous bookmark state and shows no persistent error

#### Scenario: Unauthenticated user clicks bookmark

- **WHEN** an unauthenticated user clicks the bookmark button
- **THEN** the UI redirects to the login page and does not toggle the bookmark state

### Requirement: Bookmark state reflects server on load

When a StoryCard renders, the system SHALL initialize the bookmark state from the story's bookmarked status as returned by the API, not from local component state.

#### Scenario: Story is bookmarked

- **WHEN** a StoryCard renders for a story that is bookmarked by the current user
- **THEN** the bookmark icon shows the bookmarked state

#### Scenario: Story is not bookmarked

- **WHEN** a StoryCard renders for a story that is not bookmarked by the current user
- **THEN** the bookmark icon shows the unbookmarked state
