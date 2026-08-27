import { Layer } from "effect"
import { JobRepositoryLive } from "./job.repository"
import { InterestRepositoryLive } from "./interest.repository"
import { UserRepositoryLive } from "./user.repository"
import { EvidenceRepositoryLive } from "./evidence.repository"
import { StoryRepositoryLive } from "./story.repository"
import { ChatRepositoryLive } from "./chat.repository"
import { InteractionRepositoryLive } from "./interaction.repository"
import { BookmarkRepositoryLive } from "./bookmark.repository"

export const RepositoryLiveLayer = Layer.mergeAll(
  StoryRepositoryLive,
  EvidenceRepositoryLive,
  ChatRepositoryLive,
  UserRepositoryLive,
  InteractionRepositoryLive,
  InterestRepositoryLive,
  JobRepositoryLive,
  BookmarkRepositoryLive
)

export const RepositoryTestLayer = RepositoryLiveLayer
