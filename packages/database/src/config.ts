import { Schema } from "effect"

const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i

const DatabaseConfigSchema = Schema.Struct({
  url: Schema.String.pipe(Schema.pattern(URL_REGEX)),
})

export type DatabaseConfig = Schema.Schema.Type<typeof DatabaseConfigSchema>

export function loadDatabaseConfig(url?: string): DatabaseConfig {
  return Schema.decodeUnknownSync(DatabaseConfigSchema)({
    url:
      url ??
      process.env.DATABASE_URL ??
      "postgresql://weric:***@localhost:5432/weric",
  })
}
