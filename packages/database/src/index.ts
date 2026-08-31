export { createDb, type Db } from "./connection.ts"
export { loadDatabaseConfig, type DatabaseConfig } from "./config.ts"
export * as schema from "./schema/tables.ts"
export type { DbJob } from "./schema/tables.ts"

export { DrizzleDB, DatabaseLiveLayer, DatabaseTestLayer } from "./layer.ts"
export {
  StoryRepository,
  StoryRepositoryLive,
  EvidenceRepository,
  EvidenceRepositoryLive,
  EntityRepository,
  RelationshipRepository,
  ConceptRepository,
  ConceptRepositoryLive,
  ConceptEdgeRepository,
  ConceptEdgeRepositoryLive,
  ConceptStoryRepository,
  ConceptStoryRepositoryLive,
  UserRepository,
  UserRepositoryLive,
  InteractionRepository,
  InteractionRepositoryLive,
  BookmarkRepository,
  BookmarkRepositoryLive,
  JobRepository,
  JobRepositoryLive,
  ChatRepository,
  ChatRepositoryLive,
  InterestRepository,
  InterestRepositoryLive,
  NotFoundError,
  ConflictError,
  ConnectionError,
  tryDb,
  RepositoryLiveLayer,
  RepositoryTestLayer,
} from "./repositories/index.ts"
export type {
  StoryQueryOptions,
  StoryWithEvidenceCount,
  StoryDetail,
  EvidenceSearchRow,
  InteractionAggregate,
  InteractionWithStory,
  BookmarkWithStory,
  InterestRow,
  ChatListRow,
  ChatDetail,
  RepositoryError,
} from "./repositories/index.ts"

export { Database } from "./connection.ts"
