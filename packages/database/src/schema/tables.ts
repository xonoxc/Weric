import {
  pgTable,
  uuid,
  text,
  real,
  jsonb,
  integer,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core"

export const stories = pgTable(
  "stories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    summary: text("summary"),
    confidence: real("confidence").default(0),
    status: text("status", { enum: ["draft", "published", "archived"] })
      .default("draft")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index("idx_stories_status").on(table.status),
    index("idx_stories_created_at").on(table.createdAt),
    index("idx_stories_confidence").on(table.confidence),
  ]
)

export const evidence = pgTable(
  "evidence",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: text("source").notNull(),
    url: text("url").notNull().unique(),
    author: text("author"),
    title: text("title").notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata").default("{}").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    discoveredAt: timestamp("discovered_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    index("idx_evidence_source").on(table.source),
    index("idx_evidence_discovered_at").on(table.discoveredAt),
  ]
)

export const storyEvidence = pgTable(
  "story_evidence",
  {
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    evidenceId: uuid("evidence_id")
      .notNull()
      .references(() => evidence.id, { onDelete: "cascade" }),
  },
  table => [
    primaryKey({ columns: [table.storyId, table.evidenceId] }),
    index("idx_story_evidence_story_id").on(table.storyId),
    index("idx_story_evidence_evidence_id").on(table.evidenceId),
  ]
)

export const entities = pgTable(
  "entities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    aliases: jsonb("aliases").default("[]").notNull(),
  },
  table => [
    index("idx_entities_name").on(table.name),
    index("idx_entities_type").on(table.type),
  ]
)

export const storyEntities = pgTable(
  "story_entities",
  {
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
  },
  table => [
    primaryKey({ columns: [table.storyId, table.entityId] }),
    index("idx_story_entities_story_id").on(table.storyId),
    index("idx_story_entities_entity_id").on(table.entityId),
  ]
)

export const relationships = pgTable(
  "relationships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceEntity: uuid("source_entity")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    targetEntity: uuid("target_entity")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    relationType: text("relation_type").notNull(),
  },
  table => [
    index("idx_relationships_source").on(table.sourceEntity),
    index("idx_relationships_target").on(table.targetEntity),
  ]
)

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    username: text("username").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    uniqueIndex("idx_users_email").on(table.email),
    uniqueIndex("idx_users_username").on(table.username),
  ]
)

export const interests = pgTable(
  "interests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topic: text("topic").notNull(),
    score: real("score").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index("idx_interests_user_id").on(table.userId),
    index("idx_interests_topic").on(table.topic),
  ]
)

export const interactions = pgTable(
  "interactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    interactionType: text("interaction_type").notNull(),
    duration: integer("duration"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index("idx_interactions_user_id").on(table.userId),
    index("idx_interactions_story_id").on(table.storyId),
    index("idx_interactions_created_at").on(table.createdAt),
  ]
)

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    uniqueIndex("idx_bookmarks_user_story").on(table.userId, table.storyId),
    index("idx_bookmarks_user_id").on(table.userId),
    index("idx_bookmarks_story_id").on(table.storyId),
  ]
)

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").notNull(),
    payload: jsonb("payload").default("{}").notNull(),
    status: text("status", {
      enum: ["pending", "running", "completed", "failed"],
    })
      .default("pending")
      .notNull(),
    retries: integer("retries").default(0).notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    executedAt: timestamp("executed_at", { withTimezone: true }),
  },
  table => [
    index("idx_jobs_status").on(table.status),
    index("idx_jobs_type").on(table.type),
    index("idx_jobs_scheduled_at").on(table.scheduledAt),
  ]
)
