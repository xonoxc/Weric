import { z } from "zod"

export const BookmarkSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  storyId: z.string().uuid(),
  createdAt: z.string().datetime(),
})
export type Bookmark = z.infer<typeof BookmarkSchema>

export const CreateBookmarkInputSchema = z.object({
  storyId: z.string().uuid(),
})
export type CreateBookmarkInput = z.infer<typeof CreateBookmarkInputSchema>
