// @weric/auth — Authentication logic (Better Auth)

import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { username } from "better-auth/plugins"
import type { Db } from "@weric/database"

export function createAuth(db: Db) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [username()],
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
