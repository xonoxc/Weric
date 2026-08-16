import { Context, Effect, Layer } from "effect"
import { DrizzleDB } from "~db/layer.ts"
import { StoryRepository, StoryRepositoryLive } from "./story.repository.ts"
import { EvidenceRepository } from "./evidence.repository.ts"
import { EntityRepository } from "./entity.repository.ts"
import { RelationshipRepository } from "./relationship.repository.ts"
import { UserRepository, UserRepositoryLive } from "./user.repository.ts"
import {
  InteractionRepository,
  InteractionRepositoryLive,
} from "./interaction.repository.ts"
import { BookmarkRepository } from "./bookmark.repository.ts"
import { JobRepository } from "./job.repository.ts"
import {
  InterestRepository,
  InterestRepositoryLive,
} from "./interest.repository.ts"

export class StoryRepo extends Context.Tag("StoryRepo")<
  StoryRepo,
  StoryRepository
>() {}
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
export class UserRepo extends Context.Tag("UserRepo")<
  UserRepo,
  UserRepository
>() {}
export class InteractionRepo extends Context.Tag("InteractionRepo")<
  InteractionRepo,
  InteractionRepository
>() {}
export class BookmarkRepo extends Context.Tag("BookmarkRepo")<
  BookmarkRepo,
  BookmarkRepository
>() {}
export class JobRepo extends Context.Tag("JobRepo")<JobRepo, JobRepository>() {}
export class InterestRepo extends Context.Tag("InterestRepo")<
  InterestRepo,
  InterestRepository
>() {}

const StoryRepoLive: Layer.Layer<StoryRepo, never, DrizzleDB> =
  Layer.unwrapEffect(
    Effect.map(DrizzleDB, db =>
      Layer.succeed(StoryRepo, StoryRepositoryLive(db) as never)
    )
  ) as Layer.Layer<StoryRepo, never, DrizzleDB>

const EvidenceRepoLive: Layer.Layer<EvidenceRepo, never, DrizzleDB> =
  Layer.unwrapEffect(
    Effect.map(DrizzleDB, db =>
      Layer.succeed(EvidenceRepo, new EvidenceRepository(db))
    )
  )

const EntityRepoLive: Layer.Layer<EntityRepo, never, DrizzleDB> =
  Layer.unwrapEffect(
    Effect.map(DrizzleDB, db =>
      Layer.succeed(EntityRepo, new EntityRepository(db))
    )
  )

const RelationshipRepoLive: Layer.Layer<RelationshipRepo, never, DrizzleDB> =
  Layer.unwrapEffect(
    Effect.map(DrizzleDB, db =>
      Layer.succeed(RelationshipRepo, new RelationshipRepository(db))
    )
  )

const UserRepoLive: Layer.Layer<UserRepo, never, DrizzleDB> =
  Layer.unwrapEffect(
    Effect.map(DrizzleDB, db =>
      Layer.succeed(UserRepo, UserRepositoryLive(db) as never)
    )
  ) as Layer.Layer<UserRepo, never, DrizzleDB>

const InteractionRepoLive: Layer.Layer<InteractionRepo, never, DrizzleDB> =
  Layer.unwrapEffect(
    Effect.map(DrizzleDB, db =>
      Layer.succeed(InteractionRepo, InteractionRepositoryLive(db) as never)
    )
  ) as Layer.Layer<InteractionRepo, never, DrizzleDB>

const BookmarkRepoLive: Layer.Layer<BookmarkRepo, never, DrizzleDB> =
  Layer.unwrapEffect(
    Effect.map(DrizzleDB, db =>
      Layer.succeed(BookmarkRepo, new BookmarkRepository(db))
    )
  )

const JobRepoLive: Layer.Layer<JobRepo, never, DrizzleDB> = Layer.unwrapEffect(
  Effect.map(DrizzleDB, db => Layer.succeed(JobRepo, new JobRepository(db)))
)

const InterestRepoLive: Layer.Layer<InterestRepo, never, DrizzleDB> =
  Layer.unwrapEffect(
    Effect.map(DrizzleDB, db =>
      Layer.succeed(InterestRepo, InterestRepositoryLive(db) as never)
    )
  ) as Layer.Layer<InterestRepo, never, DrizzleDB>

export const RepositoryLiveLayer: Layer.Layer<
  | StoryRepo
  | EvidenceRepo
  | EntityRepo
  | RelationshipRepo
  | UserRepo
  | InteractionRepo
  | BookmarkRepo
  | JobRepo
  | InterestRepo,
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
  JobRepoLive,
  InterestRepoLive
)

export const RepositoryTestLayer: Layer.Layer<
  | StoryRepo
  | EvidenceRepo
  | EntityRepo
  | RelationshipRepo
  | UserRepo
  | InteractionRepo
  | BookmarkRepo
  | JobRepo
  | InterestRepo,
  never,
  DrizzleDB
> = RepositoryLiveLayer
