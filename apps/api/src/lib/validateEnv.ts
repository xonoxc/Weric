import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid URL")
    .refine(v => v.startsWith("postgresql://"), {
      message: "DATABASE_URL must start with postgresql://",
    }),
  BETTER_AUTH_SECRET: z
    .string()
    .min(1, "BETTER_AUTH_SECRET is required")
    .refine(v => v !== "change-me-in-production", {
      message: "BETTER_AUTH_SECRET must not be the default placeholder value",
    }),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
  GITHUB_CLIENT_ID: z.string().optional().default(""),
  GITHUB_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GROQ_API_KEY: z.string().optional().default(""),
  API_PORT: z.coerce.number().int().positive().optional().default(3000),
  WEB_URL: z
    .string()
    .url("WEB_URL must be a valid URL")
    .optional()
    .default("http://localhost:5173"),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .optional()
    .default("info"),
})

type ValidatedEnv = z.infer<typeof envSchema>

export function validateEnv(): ValidatedEnv {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const messages = result.error.errors
      .map(e => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n")

    console.error("\nEnvironment variable validation failed:\n")
    console.error(messages)
    console.error()

    process.exit(1)
  }

  if (
    (result.data.GITHUB_CLIENT_ID && !result.data.GITHUB_CLIENT_SECRET) ||
    (!result.data.GITHUB_CLIENT_ID && result.data.GITHUB_CLIENT_SECRET)
  ) {
    console.error(
      "\nGITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must both be set or both be empty\n"
    )
    process.exit(1)
  }

  if (
    (result.data.GOOGLE_CLIENT_ID && !result.data.GOOGLE_CLIENT_SECRET) ||
    (!result.data.GOOGLE_CLIENT_ID && result.data.GOOGLE_CLIENT_SECRET)
  ) {
    console.error(
      "\nGOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must both be set or both be empty\n"
    )
    process.exit(1)
  }

  return result.data
}
