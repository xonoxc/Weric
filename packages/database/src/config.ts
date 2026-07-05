import { z } from "zod"

const DatabaseConfigSchema = z.object({
  url: z.string().url(),
})

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>

export function loadDatabaseConfig(url?: string): DatabaseConfig {
  return DatabaseConfigSchema.parse({
    url: url ?? "postgresql://weric:weric@localhost:5432/weric",
  })
}
