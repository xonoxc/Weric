import { Context, Effect, Layer } from "effect"
import { Database, DatabaseLive } from "~db/connection"
import { AuthService, AuthServiceLive } from "~api/services/auth.service"
import { JobBus, JobBusLive } from "~api/lib/job-bus"

import type { Auth } from "@weric/auth"

export type AppContext = Context.Context<Database | AuthService | JobBus>

export interface BuiltAppContext {
  readonly context: AppContext
  readonly auth: Auth
}

export const buildAppContext = (): BuiltAppContext => {
  const context = Effect.runSync(
    Layer.build(
      Layer.mergeAll(
        DatabaseLive,
        AuthServiceLive.pipe(Layer.provide(DatabaseLive)),
        JobBusLive
      )
    ).pipe(Effect.scoped)
  )
  const auth = Context.get(context, AuthService).auth

  return { context, auth }
}
