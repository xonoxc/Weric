import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { Effect } from "effect"
import { JobRepository } from "@weric/database"
import { jobBus } from "~api/lib/job-bus.ts"

import type { StreamWriter } from "~api/lib/job-bus.ts"
import type { ApiVariables } from "~api/app.ts"

export function createEventsRoutes(jobRepo: JobRepository) {
  const router = new Hono<{ Variables: ApiVariables }>()

  router.get("/jobs/:id", async c => {
    const { id } = c.req.param()
    const job = await Effect.runPromise(jobRepo.findById(id)).catch(() => null)
    if (!job) {
      return c.json({ error: "Job not found" }, 404)
    }
    return c.json(job)
  })

  router.get("/events", c => {
    const jobId = c.req.query("jobId")?.trim()
    if (!jobId) {
      return c.json({ error: "jobId query parameter is required" }, 400)
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
              .writeSSE({
                data: JSON.stringify(data),
                event,
              })
              .catch(() => {})
          }
        },
        close: () => (closeRef.current = true),
        onAbort: cb => stream.onAbort(cb),
      }

      jobBus.registerClient(jobId, writer)

      const clientKeepalive = setInterval(() => {
        stream.write(": keepalive\n\n").catch(() => {})
      }, 5_000)

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
