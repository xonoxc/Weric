import { Config, Context, Effect, Layer, Schema } from "effect"
import {
  DB_URL_REGEX,
  HTTP_URL_REGEX,
  DEFAULT_DATABASE_URL,
} from "@weric/shared"

export const WericConfigSchema = Schema.Struct({
  database: Schema.Struct({
    url: Schema.optional(Schema.String.pipe(Schema.pattern(DB_URL_REGEX))).pipe(
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

export class WericConfigService extends Context.Tag("WericConfigService")<
  WericConfigService,
  WericConfig
>() {}

const configFromEnv = Effect.gen(function* () {
  const databaseUrl = yield* Config.string("DATABASE_URL").pipe(
    Config.withDefault(DEFAULT_DATABASE_URL)
  )
  const jwtSecret = yield* Config.string("JWT_SECRET").pipe(
    Config.withDefault("change-me-in-production")
  )
  const betterAuthSecret = yield* Config.string("BETTER_AUTH_SECRET").pipe(
    Config.withDefault("change-me-in-production")
  )
  const betterAuthUrl = yield* Config.string("BETTER_AUTH_URL").pipe(
    Config.withDefault("http://localhost:3000")
  )
  const port = yield* Config.number("API_PORT").pipe(Config.withDefault(3000))
  const logLevel = yield* Config.string("LOG_LEVEL").pipe(
    Config.withDefault("info")
  )
  const groqApiKey = yield* Config.string("GROQ_API_KEY").pipe(
    Config.withDefault("")
  )

  return Schema.decodeUnknownSync(WericConfigSchema)({
    database: { url: databaseUrl },
    auth: { jwtSecret, betterAuthSecret, betterAuthUrl },
    api: { port },
    logging: { level: logLevel },
    ai: {
      groqApiKey,
    },
  })
})

export const ConfigLiveLayer: Layer.Layer<WericConfigService> = Layer.effect(
  WericConfigService,
  Effect.orDie(configFromEnv)
)

export function loadDatabaseUrl(url?: string): string {
  const DatabaseUrlSchema = Schema.String.pipe(Schema.pattern(DB_URL_REGEX))
  return Schema.decodeUnknownSync(DatabaseUrlSchema)(
    url ?? process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL
  )
}
