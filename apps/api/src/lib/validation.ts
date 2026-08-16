import { z } from "zod"

import type { Context } from "hono"
import type { AuthUser } from "@weric/auth"
import type { ApiVariables } from "~api/app.ts"

import { HttpError } from "~api/lib/http-error.ts"

export const IsoDateString = z
  .union([z.instanceof(Date), z.string()])
  .transform(value => (value instanceof Date ? value.toISOString() : value))

export const PaginationQuery = (maxLimit: number) =>
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(maxLimit).default(20),
  })

export function requireUser(c: Context<{ Variables: ApiVariables }>): AuthUser {
  const user = c.get("user")
  if (!user) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
  }
  return user
}
