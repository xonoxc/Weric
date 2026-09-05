import type { MiddlewareHandler } from "hono"
import type { ApiVariables } from "~api/app.ts"
import type { Auth, AuthUser, AuthSession } from "@weric/auth"

export function createSessionMiddleware(
  auth: Auth
): MiddlewareHandler<{ Variables: ApiVariables }> {
  return async (c, next) => {
    if (
      c.req.path.startsWith("/api/auth") ||
      c.req.path.startsWith("/internal")
    ) {
      await next()
      return
    }

    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session) {
      c.set("user", null)
      c.set("session", null)
      await next()
      return
    }

    c.set("user", session.user as AuthUser)
    c.set("session", session.session as AuthSession)
    await next()
  }
}
