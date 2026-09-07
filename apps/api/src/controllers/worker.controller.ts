import { Effect, Fiber, Schema, Stream } from "effect"
import { JobService } from "~api/services/job.service"
import { JobBus } from "~api/lib/job-bus.ts"
import { JobStatus } from "@weric/contracts"
import { streamSSE } from "hono/streaming"
import { parseReqBody } from "@weric/utils"

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
  graph: Schema.optional(
    Schema.Struct({
      nodes: Schema.Array(Schema.Unknown),
      edges: Schema.Array(Schema.Unknown),
      conceptStories: Schema.optional(Schema.Array(Schema.Unknown)),
    })
  ),
  status: Schema.optional(JobStatus),
})

const TerminalJobStatus = Schema.Literal("completed", "failed")

export interface WorkerControllerShape {
  readonly streamEvents: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>

  readonly jobProgress: (
    c: HonoCtx<{ Variables: ApiVariables }>
  ) => Effect.Effect<Response, unknown>
}

export class WorkerController extends Effect.Service<WorkerControllerShape>()(
  "WorkerController",
  {
    effect: Effect.gen(function* () {
      const jobService = yield* JobService
      const jobBus = yield* JobBus

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

              const abort = new Promise<void>(resolve => {
                stream.onAbort(resolve)
              })

              await Effect.runPromise(
                Effect.scoped(
                  Effect.gen(function* () {
                    const drain = yield* jobBus.subscribeWorker().pipe(
                      Effect.flatMap(subscription =>
                        Stream.fromQueue(subscription).pipe(
                          Stream.tap(event =>
                            Effect.sync(() => {
                              if (event._tag === "init") {
                                writer.send("init", event.jobs)
                              } else {
                                writer.send("new_job", event.job)
                              }
                            })
                          ),
                          Stream.runDrain
                        )
                      ),
                      Effect.fork
                    )

                    yield* Effect.promise(() => abort)
                    yield* Fiber.interrupt(drain)
                  })
                )
              )

              clearInterval(keepalive)
            })
          ),

        jobProgress: ctx =>
          Effect.gen(function* () {
            const raw = yield* parseReqBody(ctx.req)

            const body = Schema.decodeUnknownSync(JobProgressSchema)(raw)

            yield* jobBus.publishClient({
              jobId: body.jobId,
              event: "progress",
              progress: body.progress,
              message: body.message,
              stories: body.stories,
              graph: body.graph,
            })

            const terminal = Schema.decodeUnknownEither(TerminalJobStatus)(
              body.status
            )
            if (terminal._tag === "Right") {
              yield* jobBus.publishClient({
                jobId: body.jobId,
                event: "status",
                status: terminal.right,
              })
            }

            return ctx.json({ ok: true })
          }),
      } satisfies WorkerControllerShape
    }),
  }
) {}

export const WorkerControllerLive = WorkerController.Default
