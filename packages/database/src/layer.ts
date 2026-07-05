import { Context, Effect, Layer } from "effect"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { WericConfigService } from "@weric/config"
import * as schema from "./schema/tables.ts"
import type { Db } from "./connection.ts"

export class DrizzleDB extends Context.Tag("DrizzleDB")<DrizzleDB, Db>() {}

export const DatabaseLiveLayer: Layer.Layer<DrizzleDB, never, WericConfigService> =
  Layer.effect(
    DrizzleDB,
    Effect.gen(function* () {
      const config = yield* WericConfigService
      const client = postgres(config.database.url)
      const db = drizzle(client, { schema })
      return db as unknown as Db
    })
  )

export const DatabaseTestLayer: Layer.Layer<DrizzleDB> = Layer.effect(
  DrizzleDB,
  Effect.sync(() => {
    const client = postgres("postgresql://weric:weric@localhost:5432/weric_test", {
      max: 1,
    })
    return drizzle(client, { schema }) as unknown as Db
  })
)
