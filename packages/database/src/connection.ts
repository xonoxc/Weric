import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema/tables.ts"
import { loadDatabaseConfig } from "./config.ts"

export function createDb() {
  const config = loadDatabaseConfig()
  const client = postgres(config.url)
  return drizzle(client, { schema })
}

export type Db = ReturnType<typeof createDb>
