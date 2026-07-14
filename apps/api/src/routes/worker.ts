import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { Effect } from "effect"
import { JobRepository } from "@weric/database"
import { jobBus } from "../lib/job-bus.ts"
import type { StreamWriter } from "../lib/job-bus.ts"

export function createWorkerRoutes(jobRepo: JobRepository) {
  const router = new Hono()

  router.get("/worker/events", c => {
    return streamSSE(c, async stream => {
      const writer: StreamWriter = {
        send: (event, data) => {
          stream.writeSSE({ data: JSON.stringify(data), event }).catch(() => {})
        },
        close: () => {},
        onAbort: cb => {
          stream.onAbort(cb)
        },
      }

      const pendingJobs = await Effect.runPromise(jobRepo.findPending()).catch(
        () => []
      )

      if (pendingJobs.length > 0) {
        writer.send(
          "init",
          pendingJobs.map(j => ({ id: j.id, type: j.type, payload: j.payload }))
        )
      }

      const keepalive = setInterval(() => {
        stream.write(": keepalive\n\n").catch(() => {})
      }, 10_000)

      jobBus.registerWorker(writer)

      await new Promise<void>(resolve => {
        stream.onAbort(() => {
          clearInterval(keepalive)
          jobBus.unregisterWorker(writer)
          resolve()
        })
      })
    })
  })

  router.post("/job-progress", async c => {
    const body = await c.req.json<{
      jobId: string
      progress: number
      message?: string
      stories?: unknown[]
      status?: string
    }>()

    if (!body.jobId) {
      return c.json({ error: "jobId required" }, 400)
    }

    jobBus.sendToClient(body.jobId, "progress", {
      progress: body.progress,
      message: body.message ?? "",
      stories: body.stories,
    })

    if (body.status === "completed" || body.status === "failed") {
      jobBus.sendToClient(body.jobId, "status", { status: body.status })
      jobBus.closeClient(body.jobId)
    }

    return c.json({ ok: true })
  })

  return router
}
