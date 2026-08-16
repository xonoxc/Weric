import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { Effect } from "effect"
import { JobRepository } from "@weric/database"
import { JobStatus } from "@weric/contracts"
import { z } from "zod"
import { jobBus } from "~api/lib/job-bus.ts"

import type { StreamWriter } from "~api/lib/job-bus.ts"

const JobProgressSchema = z.object({
  jobId: z.string().min(1),
  progress: z.number().min(0).max(1),
  message: z.string().optional().default(""),
  stories: z.array(z.unknown()).optional(),
  status: JobStatus.optional(),
})

const TerminalJobStatus = JobStatus.extract(["completed", "failed"])

export function createWorkerRoutes(jobRepo: JobRepository) {
  const router = new Hono()

  router.get("/worker/events", c => {
    return streamSSE(c, async stream => {
      const writer: StreamWriter = {
        send: (event, data) => {
          stream
            .writeSSE({
              data: JSON.stringify(data),
              event,
            })
            .catch(() => {})
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
      }, 5_000)

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
    const body = JobProgressSchema.parse(await c.req.json())

    jobBus.sendToClient(body.jobId, "progress", {
      progress: body.progress,
      message: body.message,
      stories: body.stories,
    })

    const terminal = TerminalJobStatus.safeParse(body.status)
    if (terminal.success) {
      jobBus.sendToClient(body.jobId, "status", {
        status: terminal.data,
      })
      jobBus.closeClient(body.jobId)
    }

    return c.json({ ok: true })
  })

  return router
}
