export { StoryNormalizer } from "./normalizer.ts"
export type { NormalizedDocument } from "./normalizer.ts"
export { StoryMatcher } from "./matcher.ts"
export type { MatchResult } from "./matcher.ts"
export { EntityExtractor } from "./extractor.ts"
export type { ExtractedEntity } from "./extractor.ts"
export { StoryMerger } from "./merger.ts"
export type { MergeResult } from "./merger.ts"
export { TimelineBuilder } from "./timeline.ts"
export type { TimelineEntry } from "./timeline.ts"
export { StoryService } from "./service.ts"
export type { IngestResult } from "./service.ts"
export {
  NormalizationError,
  DuplicateEvidenceError,
  MatchError,
  ExtractionError,
  MergeError,
  StoryNotFoundError,
  ServiceError,
} from "./errors.ts"
export type { StoryError } from "./errors.ts"
