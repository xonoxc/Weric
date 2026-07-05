# Database

## Principles

- **PostgreSQL is the canonical source of truth.** All persisted knowledge lives in PostgreSQL.
- **Stories are derived from evidence.** A story without evidence does not exist.
- **Evidence is immutable.** Once stored, evidence is never modified or deleted. Corrections add new evidence.
- **Recommendations may be regenerated.** Recommendations are derived and ephemeral. They are always recomputable from stories and interactions.
- **Domain models must remain normalized.** No duplicated information.

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    users     │       │     stories      │       │   evidence   │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)          │       │ id (PK)      │
│ email        │       │ title            │       │ source       │
│ username     │       │ slug (UNIQUE)    │       │ url (UNIQUE) │
│ createdAt    │       │ summary          │       │ author       │
└──────┬───────┘       │ confidence       │       │ title        │
       │               │ status           │       │ content      │
       │               │ createdAt        │       │ metadata (JB)│
       │               │ updatedAt        │       │ publishedAt  │
       │               └────────┬─────────┘       │ discoveredAt │
       │                        │                 └──────┬───────┘
       │                        │                        │
       │               ┌────────▼─────────┐     ┌────────▼────────┐
       │               │ story_evidence   │     │ story_evidence  │
       │               │ (join table)     │     │ (join table)    │
       │               ├──────────────────┤     ├─────────────────┤
       │               │ storyId (FK)     │────▶│ evidenceId (FK) │
       │               │ evidenceId (FK)  │     └─────────────────┘
       │               └──────────────────┘
       │
       │  ┌──────────────┐    ┌──────────────────┐
       │  │  interests   │    │  interactions    │
       │  ├──────────────┤    ├──────────────────┤
       │  │ id (PK)      │    │ id (PK)          │
       └──│ userId (FK)  │    │ userId (FK)      │
          │ topic        │    │ storyId (FK)     │
          │ score        │    │ interactionType  │
          │ updatedAt    │    │ duration         │
          └──────────────┘    │ createdAt        │
          ┌──────────────┐    └──────────────────┘
          │  bookmarks   │
          ├──────────────┤    ┌──────────────────┐
          │ id (PK)      │    │  entities        │
          │ userId (FK)  │    ├──────────────────┤
          │ storyId (FK) │    │ id (PK)          │
          │ createdAt    │    │ name             │
          └──────────────┘    │ type             │
                              │ aliases (JB)     │
          ┌──────────────┐    └────────┬─────────┘
          │relationships │            │
          ├──────────────┤    ┌───────▼──────────┐
          │ id (PK)      │    │ story_entities   │
          │ sourceEntity │    │ (join table)     │
          │ targetEntity │    ├──────────────────┤
          │ relationType │    │ storyId (FK)     │
          └──────────────┘    │ entityId (FK)    │
                              └──────────────────┘
          ┌──────────────┐
          │    jobs      │
          ├──────────────┤
          │ id (PK)      │
          │ type         │
          │ payload (JB) │
          │ status       │
          │ retries      │
          │ scheduledAt  │
          │ executedAt   │
          └──────────────┘
```

## Tables

### `stories`

A unified story built from one or more pieces of evidence.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | `uuid` | PK, default `gen_random_uuid()` | Unique identifier |
| title | `text` | NOT NULL | Story title |
| slug | `text` | UNIQUE, NOT NULL | URL-friendly identifier |
| summary | `text` | | AI-generated or manual summary |
| confidence | `real` | DEFAULT 0.0 | Confidence score (0.0 - 1.0) |
| status | `text` | DEFAULT 'draft' | One of: draft, published, archived |
| createdAt | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |
| updatedAt | `timestamptz` | NOT NULL, default `now()` | Last update timestamp |

### `evidence`

Raw information collected from the internet. Immutable after insertion.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | `uuid` | PK, default `gen_random_uuid()` | Unique identifier |
| source | `text` | NOT NULL | Source type (e.g., rss, github, reddit, hn, web) |
| url | `text` | UNIQUE, NOT NULL | Original URL |
| author | `text` | | Content author |
| title | `text` | NOT NULL | Evidence title |
| content | `text` | NOT NULL | Full content or extracted text |
| metadata | `jsonb` | DEFAULT '{}' | Source-specific metadata |
| publishedAt | `timestamptz` | | Original publication date |
| discoveredAt | `timestamptz` | NOT NULL, default `now()` | Discovery timestamp |

### `story_evidence`

Many-to-many relationship between stories and evidence.

| Column | Type | Constraints | Description |
|---|---|---|---|
| storyId | `uuid` | FK → stories(id), NOT NULL | Story reference |
| evidenceId | `uuid` | FK → evidence(id), NOT NULL | Evidence reference |

Unique constraint on `(storyId, evidenceId)`.

### `entities`

Named entities extracted from evidence and stories.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | `uuid` | PK, default `gen_random_uuid()` | Unique identifier |
| name | `text` | NOT NULL | Entity name |
| type | `text` | NOT NULL | Entity type (person, org, location, topic, etc.) |
| aliases | `jsonb` | DEFAULT '[]' | Alternative names |

### `story_entities`

Connects entities to stories.

| Column | Type | Constraints | Description |
|---|---|---|---|
| storyId | `uuid` | FK → stories(id), NOT NULL | Story reference |
| entityId | `uuid` | FK → entities(id), NOT NULL | Entity reference |

Unique constraint on `(storyId, entityId)`.

### `relationships`

Relationships between entities.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | `uuid` | PK, default `gen_random_uuid()` | Unique identifier |
| sourceEntity | `uuid` | FK → entities(id), NOT NULL | Source entity |
| targetEntity | `uuid` | FK → entities(id), NOT NULL | Target entity |
| relationType | `text` | NOT NULL | Type of relationship |

### `users`

User accounts.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | `uuid` | PK, default `gen_random_uuid()` | Unique identifier |
| email | `text` | UNIQUE, NOT NULL | Email address |
| username | `text` | UNIQUE, NOT NULL | Display name |
| createdAt | `timestamptz` | NOT NULL, default `now()` | Registration timestamp |

### `interests`

Learned user interests.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | `uuid` | PK, default `gen_random_uuid()` | Unique identifier |
| userId | `uuid` | FK → users(id), NOT NULL | User reference |
| topic | `text` | NOT NULL | Interest topic |
| score | `real` | NOT NULL, DEFAULT 0.0 | Interest strength |
| updatedAt | `timestamptz` | NOT NULL, default `now()` | Last update |

### `interactions`

User interactions with stories.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | `uuid` | PK, default `gen_random_uuid()` | Unique identifier |
| userId | `uuid` | FK → users(id), NOT NULL | User reference |
| storyId | `uuid` | FK → stories(id), NOT NULL | Story reference |
| interactionType | `text` | NOT NULL | Type (read, read_complete, share, click, etc.) |
| duration | `integer` | | Duration in seconds |
| createdAt | `timestamptz` | NOT NULL, default `now()` | Interaction timestamp |

### `bookmarks`

User bookmarks.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | `uuid` | PK, default `gen_random_uuid()` | Unique identifier |
| userId | `uuid` | FK → users(id), NOT NULL | User reference |
| storyId | `uuid` | FK → stories(id), NOT NULL | Story reference |
| createdAt | `timestamptz` | NOT NULL, default `now()` | Bookmark timestamp |

Unique constraint on `(userId, storyId)`.

### `jobs`

Background job queue.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | `uuid` | PK, default `gen_random_uuid()` | Unique identifier |
| type | `text` | NOT NULL | Job type (discover_stories, refresh_story, etc.) |
| payload | `jsonb` | DEFAULT '{}' | Job parameters |
| status | `text` | NOT NULL, DEFAULT 'pending' | pending, running, completed, failed |
| retries | `integer` | NOT NULL, DEFAULT 0 | Retry count |
| scheduledAt | `timestamptz` | | Scheduled execution time |
| executedAt | `timestamptz` | | Actual execution time |

## Repository Ownership

| Repository | Table | Methods |
|---|---|---|
| `StoryRepository` | `stories`, `story_evidence` | create, findById, findBySlug, update, merge, search, delete |
| `EvidenceRepository` | `evidence` | create, findById, findByUrl, findBySource, list, delete |
| `EntityRepository` | `entities`, `story_entities` | create, findByName, findByType, linkToStory, merge |
| `RelationshipRepository` | `relationships` | create, findByEntity, delete |
| `UserRepository` | `users` | create, findById, findByEmail, update |
| `InteractionRepository` | `interactions` | create, findByUser, findByStory, aggregate |
| `BookmarkRepository` | `bookmarks` | create, findByUser, delete, exists |
| `JobRepository` | `jobs` | create, findPending, updateStatus, incrementRetries |

## Index Recommendations

### Primary Indexes (automatic from PKs)

- `stories(id)` — primary key
- `evidence(id)` — primary key
- `entities(id)` — primary key
- `users(id)` — primary key
- `jobs(id)` — primary key

### Performance Indexes

```sql
-- Story lookup
CREATE INDEX idx_stories_slug ON stories(slug);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_created_at ON stories(createdAt);
CREATE INDEX idx_stories_updated_at ON stories(updatedAt);
CREATE INDEX idx_stories_confidence ON stories(confidence);

-- Full text search
CREATE INDEX idx_stories_title_fts ON stories USING gin(to_tsvector('english', title));
CREATE INDEX idx_stories_summary_fts ON stories USING gin(to_tsvector('english', summary));

-- Evidence lookup
CREATE INDEX idx_evidence_url ON evidence(url);
CREATE INDEX idx_evidence_source ON evidence(source);
CREATE INDEX idx_evidence_discovered_at ON evidence(discoveredAt);
CREATE INDEX idx_evidence_published_at ON evidence(publishedAt);

-- Evidence content search
CREATE INDEX idx_evidence_content_fts ON evidence USING gin(to_tsvector('english', content));
CREATE INDEX idx_evidence_title_fts ON evidence USING gin(to_tsvector('english', title));

-- Join tables
CREATE INDEX idx_story_evidence_story_id ON story_evidence(storyId);
CREATE INDEX idx_story_evidence_evidence_id ON story_evidence(evidenceId);
CREATE INDEX idx_story_entities_story_id ON story_entities(storyId);
CREATE INDEX idx_story_entities_entity_id ON story_entities(entityId);

-- User data
CREATE INDEX idx_interests_user_id ON interests(userId);
CREATE INDEX idx_interests_topic ON interests(topic);
CREATE INDEX idx_interactions_user_id ON interactions(userId);
CREATE INDEX idx_interactions_story_id ON interactions(storyId);
CREATE INDEX idx_interactions_created_at ON interactions(createdAt);
CREATE INDEX idx_bookmarks_user_id ON bookmarks(userId);
CREATE INDEX idx_bookmarks_story_id ON bookmarks(storyId);

-- Entity lookup
CREATE INDEX idx_entities_name ON entities(name);
CREATE INDEX idx_entities_type ON entities(type);

-- Relationships
CREATE INDEX idx_relationships_source ON relationships(sourceEntity);
CREATE INDEX idx_relationships_target ON relationships(targetEntity);

-- Jobs
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_scheduled_at ON jobs(scheduledAt);
```

### JSONB Indexes

```sql
-- Evidence metadata queries
CREATE INDEX idx_evidence_metadata ON evidence USING gin(metadata);

-- Entity aliases queries
CREATE INDEX idx_entities_aliases ON entities USING gin(aliases);
```

## Migration Strategy

### Tool

Drizzle Kit generates SQL migrations from schema changes.

### Workflow

```bash
# Generate migration from schema changes
bun run db:generate

# Apply migrations
bun run db:migrate

# Rollback (if supported)
bun run db:rollback
```

### Principles

1. **Migrations are additive.** Avoid destructive changes (DROP COLUMN, DELETE) in production migrations. Use soft deletion or deprecation.
2. **Evidence is never deleted.** The `evidence` table is append-only. Deletion requires explicit justification and a separate cleanup job.
3. **Migrations are reviewed.** Every migration file is reviewed alongside code changes.
4. **Migrations are versioned.** Migration files are committed to the repository with sequential naming.

### Future Considerations

- **Partitioning.** The `evidence` table may grow large. Consider partitioning by `discoveredAt` date range.
- **Full-text search refinement.** Monitor `tsvector` index performance. Consider dedicated search (MeiliSearch, Typesense) only if PostgreSQL search becomes a bottleneck.
- **Read replicas.** If read load exceeds primary capacity, introduce read replicas for feed queries. This requires no application changes — only connection string updates in `config`.
