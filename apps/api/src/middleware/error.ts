import type { ErrorHandler } from "hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { NotFoundError, ConflictError, ConnectionError } from "@weric/database"

export class HttpError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: string,
    message: string,
    readonly details?: unknown
  ) {
    super(message)
  }
}

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
