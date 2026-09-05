import { Effect } from "effect"
import { JobService } from "~api/services/job.service"
import { jobBus } from "~api/lib/job-bus.ts"
import { streamSSE } from "hono/streaming"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"
import type { StreamWriter } from "~api/lib/job-bus.ts"
import type { RepositoryError } from "@weric/database"

export interface EventControllerShape {
  readonly getJob: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>

  readonly streamEvents: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>
}

export class EventController extends Effect.Service<EventControllerShape>()(
  "EventController",
  {
    effect: Effect.gen(function* () {
      const jobService = yield* JobService

      return {
        getJob: ctx =>
          Effect.gen(function* () {
            const id = ctx.req.param("id")!
            const job = yield* jobService.findById(id)

            if (!job) {
              return ctx.json(
                {
                  error: "Job not found",
                },
                404
              )
            }

            return ctx.json(job)
          }),

        streamEvents: ctx =>
          Effect.sync(() => {
            const jobId = ctx.req.query("jobId")?.trim()
            if (!jobId) {
              return ctx.json(
                {
                  error: "jobId query parameter is required",
                },
                400
              )
            }

            return streamSSE(ctx, async stream => {
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
          }),
      } satisfies EventControllerShape
    }),
  }
) {}

export const EventControllerLive = EventController.Default
