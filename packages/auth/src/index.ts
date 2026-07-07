// @weric/auth — Authentication logic (Better Auth)

import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { username } from "better-auth/plugins"
import type { Db } from "@weric/database"

export function createAuth(db: Db) {
  const webUrl = process.env.WEB_URL ?? "http://localhost:5173"

  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
    }),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID ?? "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      },
    },
    plugins: [username()],
    trustedOrigins: [webUrl],
    advanced: {
      database: {
        generateId: false,
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
export type AuthUser = Auth["$Infer"]["Session"]["user"]
export type AuthSession = Auth["$Infer"]["Session"]["session"]
