import { Effect, PubSub } from "effect"

export interface JobProgressEvent {
  jobId: string
  progress: number
  message: string
  status?: "completed" | "failed"
  stories?: unknown[]
  graph?: unknown
}

export class JobProgress extends Effect.Service<JobProgress>()("JobProgress", {
  effect: Effect.gen(function* () {
    const pubsub = yield* PubSub.unbounded<JobProgressEvent>()

    return {
      publish: (event: JobProgressEvent) => PubSub.publish(pubsub, event),
      subscribe: () => PubSub.subscribe(pubsub),
    }
  }),
}) {}
