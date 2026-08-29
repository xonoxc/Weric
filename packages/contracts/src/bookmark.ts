import { Schema } from "effect"

export const BookmarkSchema = Schema.Struct({
  id: Schema.UUID,
  userId: Schema.UUID,
  storyId: Schema.UUID,
  createdAt: Schema.DateTimeUtcFromDate,
})
export type Bookmark = Schema.Schema.Type<typeof BookmarkSchema>

export const CreateBookmarkInputSchema = Schema.Struct({
  storyId: Schema.UUID,
})
export type CreateBookmarkInput = Schema.Schema.Type<
  typeof CreateBookmarkInputSchema
>
