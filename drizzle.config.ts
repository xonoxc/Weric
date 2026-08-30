import { defineConfig } from "drizzle-kit"
import { DEFAULT_DATABASE_URL } from "@weric/shared"

export default defineConfig({
  schema: "./packages/database/src/schema/tables.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  },
})
