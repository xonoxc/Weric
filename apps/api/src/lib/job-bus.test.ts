import { describe, expect, it } from "@effect/vitest"
import { Chunk, Effect, Fiber, Stream } from "effect"
import { JobBus, JobBusLive } from "./job-bus.ts"

import type { ClientEvent } from "./job-bus.ts"

describe("JobBus", () => {
  it.effect("delivers new_job to every subscribed worker", () =>
    Effect.scoped(
      Effect.gen(function* () {
        const jobBus = yield* JobBus
        const first = yield* jobBus.subscribeWorker()
        const second = yield* jobBus.subscribeWorker()

        yield* jobBus.publishWorker({
          _tag: "new_job",
          job: { id: "job-1", type: "search_discover", payload: {} },
        })

        const one = Chunk.toArray(
          yield* Stream.fromQueue(first).pipe(Stream.take(1), Stream.runCollect)
        )

        const two = Chunk.toArray(
          yield* Stream.fromQueue(second).pipe(
            Stream.take(1),
            Stream.runCollect
          )
        )

        const job = { id: "job-1", type: "search_discover", payload: {} }

        expect(one).toEqual([{ _tag: "new_job", job }])
        expect(two).toEqual([{ _tag: "new_job", job }])
      })
    ).pipe(Effect.provide(JobBusLive))
  )

  it.effect("routes client events only to the matching jobId subscriber", () =>
    Effect.scoped(
      Effect.gen(function* () {
        const jobBus = yield* JobBus
        const chatASub = yield* jobBus.subscribeClient()
        const chatBSub = yield* jobBus.subscribeClient()

        const chatA = yield* Stream.fromQueue(chatASub)
          .pipe(
            Stream.filter(event => event.jobId === "chat-a"),
            Stream.take(2),
            Stream.runCollect
          )
          .pipe(Effect.fork)

        const chatB = yield* Stream.fromQueue(chatBSub)
          .pipe(
            Stream.filter(event => event.jobId === "chat-b"),
            Stream.take(1),
            Stream.runCollect
          )
          .pipe(Effect.fork)

        yield* jobBus.publishClient({
          jobId: "chat-a",
          event: "progress",
          progress: 0.1,
          message: "one",
        })
        yield* jobBus.publishClient({
          jobId: "chat-b",
          event: "progress",
          progress: 0.2,
          message: "two",
        })
        yield* jobBus.publishClient({
          jobId: "chat-a",
          event: "progress",
          progress: 0.3,
          message: "three",
        })

        expect(Chunk.toArray(yield* Fiber.join(chatA))).toEqual([
          { jobId: "chat-a", event: "progress", progress: 0.1, message: "one" },
          {
            jobId: "chat-a",
            event: "progress",
            progress: 0.3,
            message: "three",
          },
        ])

        expect(Chunk.toArray(yield* Fiber.join(chatB))).toEqual([
          { jobId: "chat-b", event: "progress", progress: 0.2, message: "two" },
        ])
      })
    ).pipe(Effect.provide(JobBusLive))
  )

  it.effect("client stream ends after a terminal status event", () =>
    Effect.scoped(
      Effect.gen(function* () {
        const jobBus = yield* JobBus
        const subscription = yield* jobBus.subscribeClient()
        const sent: ClientEvent[] = []

        const drain = yield* Stream.fromQueue(subscription)
          .pipe(
            Stream.tap(event =>
              Effect.sync(() => {
                sent.push(event)
              })
            ),
            Stream.takeWhile(event => event.event !== "status"),
            Stream.runCollect
          )
          .pipe(Effect.fork)

        yield* jobBus.publishClient({
          jobId: "chat-x",
          event: "progress",
          progress: 1,
          message: "done",
        })
        yield* jobBus.publishClient({
          jobId: "chat-x",
          event: "status",
          status: "completed",
        })

        const collected = yield* Fiber.join(drain)

        expect(Chunk.toArray(collected)).toEqual([
          {
            jobId: "chat-x",
            event: "progress",
            progress: 1,
            message: "done",
          },
        ])
        expect(sent).toEqual([
          {
            jobId: "chat-x",
            event: "progress",
            progress: 1,
            message: "done",
          },
          { jobId: "chat-x", event: "status", status: "completed" },
        ])
      })
    ).pipe(Effect.provide(JobBusLive))
  )
})
