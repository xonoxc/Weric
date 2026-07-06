export { createDb, type Db } from "./connection.ts"
export { loadDatabaseConfig, type DatabaseConfig } from "./config.ts"
export * as schema from "./schema/tables.ts"

export { DrizzleDB, DatabaseLiveLayer, DatabaseTestLayer } from "./layer.ts"
export {
  StoryRepository,
  EvidenceRepository,
  EntityRepository,
  RelationshipRepository,
  UserRepository,
  InteractionRepository,
  BookmarkRepository,
  JobRepository,
  InterestRepository,
  NotFoundError,
  ConflictError,
  ConnectionError,
  StoryRepo,
  EvidenceRepo,
  EntityRepo,
  RelationshipRepo,
  UserRepo,
  InteractionRepo,
  BookmarkRepo,
  JobRepo,
  InterestRepo,
  RepositoryLiveLayer,
  RepositoryTestLayer,
} from "./repositories/index.ts"
export type {
  StoryQueryOptions,
  StoryWithEvidenceCount,
  StoryDetail,
  EvidenceSearchRow,
  InteractionAggregate,
  BookmarkWithStory,
  InterestRow,
  RepositoryError,
} from "./repositories/index.ts"
