import { Context, Effect, Layer } from "effect"
import { createAuth } from "@weric/auth"
import { Database } from "@weric/database"

import type { Auth } from "@weric/auth"

export interface AuthServiceShape {
  readonly auth: Auth
}

export class AuthService extends Context.Tag("AuthService")<
  AuthService,
  AuthServiceShape
>() {}

export const AuthServiceLive = Layer.effect(
  AuthService,
  Effect.gen(function* () {
    const db = yield* Database
    return { auth: createAuth(db) }
  })
)
