import { Config, Context, Effect, Layer } from "effect"
import { z } from "zod"

export const WericConfigSchema = z.object({
  database: z.object({
    url: z.string().url().default("postgresql://weric:weric@localhost:5432/weric"),
  }),
  auth: z.object({
    jwtSecret: z.string().min(1).default("change-me-in-production"),
  }),
  api: z.object({
    port: z.coerce.number().int().positive().default(3000),
  }),
  logging: z.object({
    level: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  }),
  ai: z.object({
    openaiApiKey: z.string().default(""),
    geminiApiKey: z.string().default(""),
    anthropicApiKey: z.string().default(""),
  }),
})

export type WericConfig = z.infer<typeof WericConfigSchema>

export class WericConfigService extends Context.Tag("WericConfigService")<
  WericConfigService,
  WericConfig
>() {}

const configFromEnv = Effect.gen(function* () {
  const databaseUrl = yield* Config.string("DATABASE_URL").pipe(
    Config.withDefault("postgresql://weric:weric@localhost:5432/weric")
  )
  const jwtSecret = yield* Config.string("JWT_SECRET").pipe(
    Config.withDefault("change-me-in-production")
  )
  const port = yield* Config.number("API_PORT").pipe(Config.withDefault(3000))
  const logLevel = yield* Config.string("LOG_LEVEL").pipe(Config.withDefault("info"))
  const openaiApiKey = yield* Config.string("OPENAI_API_KEY").pipe(Config.withDefault(""))
  const geminiApiKey = yield* Config.string("GEMINI_API_KEY").pipe(Config.withDefault(""))
  const anthropicApiKey = yield* Config.string("ANTHROPIC_API_KEY").pipe(
    Config.withDefault("")
  )

  return WericConfigSchema.parse({
    database: { url: databaseUrl },
    auth: { jwtSecret },
    api: { port },
    logging: { level: logLevel },
    ai: {
      openaiApiKey,
      geminiApiKey,
      anthropicApiKey,
    },
  })
})

export const ConfigLiveLayer: Layer.Layer<WericConfigService> = Layer.effect(
  WericConfigService,
  Effect.orDie(configFromEnv)
)
