## ADDED Requirements

### Requirement: Story engine uses AI for summarization

The story engine's ingest pipeline SHALL call the AI service to generate a summary for each ingested story. The summary SHALL be stored with the story record.

#### Scenario: Story is ingested with AI summarization

- **WHEN** a story is ingested through the StoryService pipeline
- **THEN** the AI service is called with the story content and a summary is generated and stored

#### Scenario: AI summarization fails

- **WHEN** the AI service fails to generate a summary during ingestion
- **THEN** the story is still created with its original content and no summary, and the error is logged

### Requirement: Story engine uses AI for entity extraction

The story engine's ingest pipeline SHALL call the AI service to extract entities instead of using the rule-based EntityExtractor. Extracted entities SHALL be stored in the entities table and linked to the story.

#### Scenario: Story is ingested with AI entity extraction

- **WHEN** a story is ingested through the StoryService pipeline
- **THEN** the AI service extracts structured entities (name, type, description) and they are stored and linked to the story

#### Scenario: AI entity extraction fails

- **WHEN** the AI service fails to extract entities during ingestion
- **THEN** the story is still created without entities, and the error is logged

#### Scenario: AI extracts duplicate entities

- **WHEN** the AI extracts an entity that already exists in the database (matched by name and type)
- **THEN** the existing entity is linked to the story rather than creating a duplicate

### Requirement: Rule-based EntityExtractor is deprecated

The rule-based EntityExtractor SHALL no longer be used in the ingest pipeline. It MAY be retained as a fallback or for testing but SHALL NOT be the default path.

#### Scenario: Default ingest path uses AI

- **WHEN** StoryService is configured with default settings
- **THEN** entity extraction uses the AI service, not the rule-based extractor
