import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { jobBus } from "../lib/job-bus.ts"
import type { StreamWriter } from "../lib/job-bus.ts"
import type { ApiVariables } from "../index.ts"

export function createEventsRoutes() {
  const router = new Hono<{ Variables: ApiVariables }>()

  router.get("/events", c => {
    const jobId = c.req.query("jobId")
    if (!jobId) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "jobId query parameter is required",
          },
        },
        400
      )
    }

    return streamSSE(c, async stream => {
      const closeRef = { current: false }

      stream.onAbort(() => {
        closeRef.current = true
        jobBus.unregisterClient(jobId)
      })

      const writer: StreamWriter = {
        send: (event, data) => {
          if (!closeRef.current) {
            stream
              .writeSSE({ data: JSON.stringify(data), event })
              .catch(() => {})
          }
        },
        close: () => {
          closeRef.current = true
        },
        onAbort: cb => {
          stream.onAbort(cb)
        },
      }

      jobBus.registerClient(jobId, writer)

      const clientKeepalive = setInterval(() => {
        stream.write(": keepalive\n\n").catch(() => {})
      }, 15_000)

      while (!closeRef.current) {
        await new Promise(r => setTimeout(r, 500))
      }

      clearInterval(clientKeepalive)

      jobBus.unregisterClient(jobId)
      stream.close()
    })
  })

  return router
}
