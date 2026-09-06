import { Option } from "effect"
import { DBChat } from "~db/schema/tables"

import type { Optioned } from "@weric/utils"

export interface ChatListRow {
  id: string
  title: string
  query: Optioned<string>
  storyCount: number
  createdAt: Date
  updatedAt: Date
}

export type DBChatListRow = Pick<
  DBChat,
  "id" | "title" | "query" | "createdAt" | "updatedAt"
> & {
  storyCount: number
}

export function toChatListRow(row: DBChatListRow): ChatListRow {
  return {
    ...row,
    query: Option.fromNullable(row.query),
  }
}
