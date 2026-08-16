import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { z } from "zod"
import { jobBus } from "~api/lib/job-bus.ts"

import type { StreamWriter } from "~api/lib/job-bus.ts"
import type { ApiVariables } from "~api/app.ts"

const EventsQuery = z.object({
  jobId: z.string().min(1, "jobId query parameter is required"),
})

export function createEventsRoutes() {
  const router = new Hono<{ Variables: ApiVariables }>()

  router.get("/events", c => {
    const { jobId } = EventsQuery.parse(c.req.query())

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
