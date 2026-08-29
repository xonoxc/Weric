import { Context, Effect, Layer } from "effect"
import { JobService } from "~api/services/job.service"
import { jobBus } from "~api/lib/job-bus.ts"
import { JobStatus } from "@weric/contracts"
import { Schema } from "effect"
import { streamSSE } from "hono/streaming"

import type { ApiVariables } from "~api/app"
import type { Context as HonoCtx } from "hono"
import type { StreamWriter } from "~api/lib/job-bus.ts"

export const JobProgressSchema = Schema.Struct({
  jobId: Schema.String.pipe(Schema.minLength(1)),

  progress: Schema.Number.pipe(
    Schema.greaterThanOrEqualTo(0),
    Schema.lessThanOrEqualTo(1)
  ),
  message: Schema.optional(Schema.String).pipe(
    Schema.withDecodingDefault(() => "")
  ),
  stories: Schema.optional(Schema.Array(Schema.Unknown)),
  status: Schema.optional(JobStatus),
})

const TerminalJobStatus = Schema.Literal("completed", "failed")

export interface WorkerController {
  readonly streamEvents: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>

  readonly jobProgress: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>
}

export const WorkerController =
  Context.GenericTag<WorkerController>("WorkerController")

export const WorkerControllerLive = Layer.effect(
  WorkerController,
  Effect.gen(function* () {
    const jobService = yield* JobService

    return {
      streamEvents: ctx =>
        Effect.sync(() =>
          streamSSE(ctx, async stream => {
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

            const pendingJobs = await Effect.runPromise(
              jobService.findPending()
            ).catch(() => [])

            if (pendingJobs.length > 0) {
              writer.send(
                "init",
                pendingJobs.map(j => ({
                  id: j.id,
                  type: j.type,
                  payload: j.payload,
                }))
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
        ),

      jobProgress: ctx =>
        Effect.sync(() => {
          const body = Schema.decodeUnknownSync(JobProgressSchema)(
            ctx.req.json()
          )

          jobBus.sendToClient(body.jobId, "progress", {
            progress: body.progress,
            message: body.message,
            stories: body.stories,
          })

          const terminal = Schema.decodeUnknownEither(TerminalJobStatus)(
            body.status
          )
          if (terminal._tag === "Right") {
            jobBus.sendToClient(body.jobId, "status", {
              status: terminal.right,
            })
            jobBus.closeClient(body.jobId)
          }

          return ctx.json({ ok: true })
        }),
    }
  })
)
