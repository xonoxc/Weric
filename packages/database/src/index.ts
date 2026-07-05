export { createDb } from "./connection.ts"
export type { Db } from "./connection.ts"
export { loadDatabaseConfig } from "./config.ts"
export type { DatabaseConfig } from "./config.ts"
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
  RepositoryLiveLayer,
  RepositoryTestLayer,
} from "./repositories/index.ts"
export type {
  StoryQueryOptions,
  InteractionAggregate,
  RepositoryError,
} from "./repositories/index.ts"
