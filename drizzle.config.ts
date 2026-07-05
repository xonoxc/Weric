import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./packages/database/src/schema/tables.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/weric",
  },
})
