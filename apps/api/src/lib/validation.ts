import { Schema } from "effect"

import type { Context } from "hono"
import type { AuthUser } from "@weric/auth"
import type { ApiVariables } from "~api/app.ts"

import { HttpError } from "~api/lib/http-error.ts"

export const PaginationQuery = (maxLimit: number) =>
  Schema.Struct({
    page: Schema.optional(
      Schema.NumberFromString.pipe(Schema.int(), Schema.positive())
    ).pipe(Schema.withDecodingDefault(() => 1)),

    limit: Schema.optional(
      Schema.NumberFromString.pipe(
        Schema.int(),
        Schema.positive(),
        Schema.lessThanOrEqualTo(maxLimit)
      )
    ).pipe(Schema.withDecodingDefault(() => 20)),
  })

export const IsoDateString = Schema.DateFromString

export function requireUser(c: Context<{ Variables: ApiVariables }>): AuthUser {
  const user = c.get("user")
  if (!user) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
  }
  return user
}
