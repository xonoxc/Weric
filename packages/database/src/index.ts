// @weric/database — Drizzle ORM, repositories, migrations

export { createDb } from "./connection.ts"
export type { Db } from "./connection.ts"
export { loadDatabaseConfig } from "./config.ts"
export type { DatabaseConfig } from "./config.ts"
export * as schema from "./schema/tables.ts"
