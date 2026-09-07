import { Effect, Fiber, Stream } from "effect"
import { JobService } from "~api/services/job.service"
import { JobBus } from "~api/lib/job-bus.ts"
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
      const jobBus = yield* JobBus

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

              const clientKeepalive = setInterval(() => {
                stream.write(": keepalive\n\n").catch(() => {})
              }, 5_000)

              const finish = () => {
                if (closeRef.current) return
                closeRef.current = true
                clearInterval(clientKeepalive)
                stream.close()
              }

              stream.onAbort(finish)

              const abort = new Promise<void>(resolve => {
                stream.onAbort(resolve)
              })

              await Effect.runPromise(
                Effect.scoped(
                  Effect.gen(function* () {
                    const drain = yield* jobBus.subscribeClient().pipe(
                      Effect.flatMap(subscription =>
                        Stream.fromQueue(subscription).pipe(
                          Stream.filter(event => event.jobId === jobId),
                          Stream.tap(event =>
                            Effect.sync(() => {
                              if (event.event === "progress") {
                                writer.send("progress", {
                                  progress: event.progress,
                                  message: event.message,
                                  stories: event.stories,
                                  graph: event.graph,
                                })
                              } else {
                                writer.send("status", {
                                  status: event.status,
                                })
                              }
                            })
                          ),
                          Stream.takeWhile(event => event.event !== "status"),
                          Stream.runDrain
                        )
                      ),
                      Effect.fork
                    )

                    yield* Effect.raceFirst(
                      Effect.promise(() => abort),
                      Fiber.join(drain)
                    )
                    yield* Fiber.interrupt(drain)
                  })
                )
              )

              finish()
            })
          }),
      } satisfies EventControllerShape
    }),
  }
) {}

export const EventControllerLive = EventController.Default
