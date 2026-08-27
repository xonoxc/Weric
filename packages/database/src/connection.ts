import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema/tables.ts"
import { loadDatabaseConfig } from "./config.ts"
import { Context, Layer } from "effect"

export type Db = ReturnType<typeof createDb>

export class Database extends Context.Tag("Database")<Database, Db>() {}

export function createDb() {
  const config = loadDatabaseConfig()
  const client = postgres(config.url)
  return drizzle(client, { schema })
}

export const DatabaseLive = Layer.sync(Database, createDb)
