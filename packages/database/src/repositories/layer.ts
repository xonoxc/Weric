import { Context, Effect, Layer } from "effect"
import { DrizzleDB } from "~/layer.ts"
import { StoryRepository } from "~/repositories/story.repository.ts"
import { EvidenceRepository } from "~/repositories/evidence.repository.ts"
import { EntityRepository } from "~/repositories/entity.repository.ts"
import { RelationshipRepository } from "~/repositories/relationship.repository.ts"
import { UserRepository } from "~/repositories/user.repository.ts"
import { InteractionRepository } from "~/repositories/interaction.repository.ts"
import { BookmarkRepository } from "~/repositories/bookmark.repository.ts"
import { JobRepository } from "~/repositories/job.repository.ts"
import type { Db } from "~/connection.ts"

export class StoryRepo extends Context.Tag("StoryRepo")<StoryRepo, StoryRepository>() {}
export class EvidenceRepo extends Context.Tag("EvidenceRepo")<
  EvidenceRepo,
  EvidenceRepository
>() {}
export class EntityRepo extends Context.Tag("EntityRepo")<
  EntityRepo,
  EntityRepository
>() {}
export class RelationshipRepo extends Context.Tag("RelationshipRepo")<
  RelationshipRepo,
  RelationshipRepository
>() {}
export class UserRepo extends Context.Tag("UserRepo")<UserRepo, UserRepository>() {}
export class InteractionRepo extends Context.Tag("InteractionRepo")<
  InteractionRepo,
  InteractionRepository
>() {}
export class BookmarkRepo extends Context.Tag("BookmarkRepo")<
  BookmarkRepo,
  BookmarkRepository
>() {}
export class JobRepo extends Context.Tag("JobRepo")<JobRepo, JobRepository>() {}

const StoryRepoLive: Layer.Layer<StoryRepo, never, DrizzleDB> = Layer.effect(
  StoryRepo,
  Effect.map(DrizzleDB, (db: Db) => new StoryRepository(db))
)

const EvidenceRepoLive: Layer.Layer<EvidenceRepo, never, DrizzleDB> = Layer.effect(
  EvidenceRepo,
  Effect.map(DrizzleDB, (db: Db) => new EvidenceRepository(db))
)

const EntityRepoLive: Layer.Layer<EntityRepo, never, DrizzleDB> = Layer.effect(
  EntityRepo,
  Effect.map(DrizzleDB, (db: Db) => new EntityRepository(db))
)

const RelationshipRepoLive: Layer.Layer<RelationshipRepo, never, DrizzleDB> =
  Layer.effect(
    RelationshipRepo,
    Effect.map(DrizzleDB, (db: Db) => new RelationshipRepository(db))
  )

const UserRepoLive: Layer.Layer<UserRepo, never, DrizzleDB> = Layer.effect(
  UserRepo,
  Effect.map(DrizzleDB, (db: Db) => new UserRepository(db))
)

const InteractionRepoLive: Layer.Layer<InteractionRepo, never, DrizzleDB> = Layer.effect(
  InteractionRepo,
  Effect.map(DrizzleDB, (db: Db) => new InteractionRepository(db))
)

const BookmarkRepoLive: Layer.Layer<BookmarkRepo, never, DrizzleDB> = Layer.effect(
  BookmarkRepo,
  Effect.map(DrizzleDB, (db: Db) => new BookmarkRepository(db))
)

const JobRepoLive: Layer.Layer<JobRepo, never, DrizzleDB> = Layer.effect(
  JobRepo,
  Effect.map(DrizzleDB, (db: Db) => new JobRepository(db))
)

export const RepositoryLiveLayer: Layer.Layer<
  | StoryRepo
  | EvidenceRepo
  | EntityRepo
  | RelationshipRepo
  | UserRepo
  | InteractionRepo
  | BookmarkRepo
  | JobRepo,
  never,
  DrizzleDB
> = Layer.mergeAll(
  StoryRepoLive,
  EvidenceRepoLive,
  EntityRepoLive,
  RelationshipRepoLive,
  UserRepoLive,
  InteractionRepoLive,
  BookmarkRepoLive,
  JobRepoLive
)

export const RepositoryTestLayer: Layer.Layer<
  | StoryRepo
  | EvidenceRepo
  | EntityRepo
  | RelationshipRepo
  | UserRepo
  | InteractionRepo
  | BookmarkRepo
  | JobRepo,
  never,
  DrizzleDB
> = RepositoryLiveLayer
