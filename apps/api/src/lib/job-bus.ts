import { Effect, PubSub, Queue } from "effect"

import type { Scope } from "effect"

export interface StreamWriter {
  send(event: string, data: unknown): void
  close(): void
  onAbort(cb: () => void): void
}

export type PendingJob = {
  id: string
  type: string
  payload: unknown
}

export type WorkerEvent =
  { _tag: "init"; jobs: PendingJob[] } | { _tag: "new_job"; job: PendingJob }

export type ClientEvent = { jobId: string } & (
  | {
      event: "progress"
      progress: number
      message: string
      stories?: readonly unknown[]
      graph?: unknown
    }
  | { event: "status"; status: "completed" | "failed" }
)

export interface JobBusShape {
  readonly publishWorker: (event: WorkerEvent) => Effect.Effect<boolean>

  readonly subscribeWorker: () => Effect.Effect<
    Queue.Dequeue<WorkerEvent>,
    never,
    Scope.Scope
  >

  readonly publishClient: (event: ClientEvent) => Effect.Effect<boolean>

  readonly subscribeClient: () => Effect.Effect<
    Queue.Dequeue<ClientEvent>,
    never,
    Scope.Scope
  >
}

export class JobBus extends Effect.Service<JobBusShape>()("JobBus", {
  effect: Effect.gen(function* () {
    const workerPub = yield* PubSub.unbounded<WorkerEvent>()
    const clientPub = yield* PubSub.unbounded<ClientEvent>()

    return {
      publishWorker: event => PubSub.publish(workerPub, event),
      subscribeWorker: () => PubSub.subscribe(workerPub),
      publishClient: event => PubSub.publish(clientPub, event),
      subscribeClient: () => PubSub.subscribe(clientPub),
    } satisfies JobBusShape
  }),
}) {}

export const JobBusLive = JobBus.Default
