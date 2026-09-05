import { Effect } from "effect"
import { createAuth } from "@weric/auth"
import { Database } from "@weric/database"

import type { Auth } from "@weric/auth"

export interface AuthServiceShape {
  readonly auth: Auth
}

export class AuthService extends Effect.Service<AuthServiceShape>()(
  "AuthService",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database
      return {
        auth: createAuth(db),
      } satisfies AuthServiceShape
    }),
  }
) {}

export const AuthServiceLive = AuthService.Default
