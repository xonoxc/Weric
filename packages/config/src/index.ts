import { Config, Effect, pipe, Schema } from "effect"
import {
  DB_URL_REGEX,
  HTTP_URL_REGEX,
  DEFAULT_DATABASE_URL,
} from "@weric/shared"

export const WericConfigSchema = Schema.Struct({
  database: Schema.Struct({
    url: pipe(
      Schema.optional(pipe(Schema.String, Schema.pattern(DB_URL_REGEX))),
      Schema.withDecodingDefault(() => DEFAULT_DATABASE_URL)
    ),
  }),
  auth: Schema.Struct({
    jwtSecret: Schema.optional(Schema.String.pipe(Schema.minLength(1))).pipe(
      Schema.withDecodingDefault(() => "change-me-in-production")
    ),
    betterAuthSecret: Schema.optional(
      Schema.String.pipe(Schema.minLength(1))
    ).pipe(Schema.withDecodingDefault(() => "change-me-in-production")),
    betterAuthUrl: Schema.optional(
      Schema.String.pipe(Schema.pattern(HTTP_URL_REGEX))
    ).pipe(Schema.withDecodingDefault(() => "http://localhost:3000")),
  }),
  api: Schema.Struct({
    port: Schema.optional(
      Schema.NumberFromString.pipe(Schema.int(), Schema.positive())
    ).pipe(Schema.withDecodingDefault(() => 3000)),
  }),
  logging: Schema.Struct({
    level: Schema.optional(
      Schema.Literal("trace", "debug", "info", "warn", "error", "fatal")
    ).pipe(Schema.withDecodingDefault(() => "info" as const)),
  }),
  ai: Schema.Struct({
    groqApiKey: Schema.optional(Schema.String).pipe(
      Schema.withDecodingDefault(() => "")
    ),
  }),
})
export type WericConfig = Schema.Schema.Type<typeof WericConfigSchema>

const configFromEnv = pipe(
  Effect.all({
    databaseUrl: pipe(
      Config.string("DATABASE_URL"),
      Config.withDefault(DEFAULT_DATABASE_URL)
    ),
    jwtSecret: pipe(
      Config.string("JWT_SECRET"),
      Config.withDefault("change-me-in-production")
    ),
    betterAuthSecret: pipe(
      Config.string("BETTER_AUTH_SECRET"),
      Config.withDefault("change-me-in-production")
    ),
    betterAuthUrl: pipe(
      Config.string("BETTER_AUTH_URL"),
      Config.withDefault("http://localhost:3000")
    ),
    port: pipe(Config.number("API_PORT"), Config.withDefault(3000)),
    logLevel: pipe(Config.string("LOG_LEVEL"), Config.withDefault("info")),
    groqApiKey: pipe(Config.string("GROQ_API_KEY"), Config.withDefault("")),
  }),
  Effect.map(
    ({
      databaseUrl,
      jwtSecret,
      betterAuthSecret,
      betterAuthUrl,
      port,
      logLevel,
      groqApiKey,
    }) =>
      Schema.decodeUnknownSync(WericConfigSchema)({
        database: { url: databaseUrl },
        auth: { jwtSecret, betterAuthSecret, betterAuthUrl },
        api: { port },
        logging: { level: logLevel },
        ai: { groqApiKey },
      })
  )
)

export class WericConfigService extends Effect.Service<WericConfig>()(
  "WericConfigService",
  {
    effect: Effect.orDie(configFromEnv),
  }
) {}

export const ConfigLiveLayer = WericConfigService.Default

export function loadDatabaseUrl(url?: string): string {
  const DatabaseUrlSchema = pipe(Schema.String, Schema.pattern(DB_URL_REGEX))

  return Schema.decodeUnknownSync(DatabaseUrlSchema)(
    url ?? process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL
  )
}
