import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "~/schema/tables.ts"
import type { Db } from "~/connection.ts"

let client: ReturnType<typeof postgres> | null = null

export function getTestDb(): Db {
  if (!client) {
    client = postgres("postgresql://weric:weric@localhost:5432/weric_test", {
      max: 1,
    })
  }
  return drizzle(client, { schema }) as unknown as Db
}

export async function cleanDatabase(): Promise<void> {
  if (!client) return
  await client.unsafe(`
    TRUNCATE TABLE
      bookmarks, story_entities, story_evidence,
      interactions, interests, relationships,
      evidence, entities, stories, users, sessions,
      accounts, verifications, jobs
    CASCADE
  `)
}

export async function closeTestDb(): Promise<void> {
  if (client) {
    await client.end()
    client = null
  }
}
