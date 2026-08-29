import { NotFoundError, ConflictError, ConnectionError } from "@weric/database"
import { HttpError } from "~api/lib/http-error.ts"

import type { ErrorHandler } from "hono"
import { ParseResult } from "effect"

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HttpError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      },
      err.status
    )
  }

  if (ParseResult.isParseError(err)) {
    const formattedIssues = ParseResult.ArrayFormatter.formatErrorSync(err)

    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request",
          details: formattedIssues.map(({ path, message }) => ({
            path,
            message,
          })),
        },
      },
      400
    )
  }

  if (err instanceof NotFoundError) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: `${err.entity} with id '${err.id}' not found`,
        },
      },
      404
    )
  }

  if (err instanceof ConflictError) {
    return c.json(
      {
        error: {
          code: "CONFLICT",
          message: err.message,
        },
      },
      409
    )
  }

  if (err instanceof ConnectionError) {
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Database connection error",
        },
      },
      500
    )
  }

  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    500
  )
}
