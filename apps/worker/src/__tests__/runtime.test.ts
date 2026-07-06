import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { Effect } from "effect"
import { WorkerRuntime, type JobHandler } from "../runtime.ts"

function mockEffect<T>(val: T) {
  return Effect.succeed(val)
}

function makeMockRepo() {
  return {
    findPending: vi.fn(),
    updateStatus: vi.fn(),
    incrementRetries: vi.fn(),
  }
}

function makeHandler(type: string): JobHandler {
  return {
    type,
    handle: vi.fn().mockReturnValue(Effect.succeed(void 0)),
  }
}

describe("WorkerRuntime", () => {
  let repo: ReturnType<typeof makeMockRepo>
  let handlers: JobHandler[]
  let runtime: WorkerRuntime

  beforeEach(() => {
    vi.useFakeTimers()
    repo = makeMockRepo()
    handlers = [makeHandler("test-job")]
    runtime = new WorkerRuntime(repo as any, handlers, {
      pollIntervalMs: 1000,
      maxConcurrency: 3,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts with default options", () => {
    const r = new WorkerRuntime(repo as any, [], {})
    expect(r).toBeInstanceOf(WorkerRuntime)
  })

  it("start begins polling and triggers first poll", () => {
    repo.findPending.mockReturnValue(mockEffect([]))
    runtime.start()
    expect(repo.findPending).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1000)
    expect(repo.findPending).toHaveBeenCalledTimes(2)
    runtime.shutdown()
  })

  it("poll dispatches pending jobs to the matching handler", async () => {
    const job = {
      id: "j1",
      type: "test-job",
      payload: { url: "https://example.com" },
      retries: 0,
    }
    repo.findPending.mockReturnValue(mockEffect([job]))
    repo.updateStatus.mockReturnValue(mockEffect(undefined))
    runtime.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(repo.updateStatus).toHaveBeenCalledWith("j1", "running")
    await vi.advanceTimersByTimeAsync(0)
    expect(handlers[0]!.handle).toHaveBeenCalledWith(
      { url: "https://example.com" },
      "j1"
    )
    await vi.advanceTimersByTimeAsync(0)
    expect(repo.updateStatus).toHaveBeenCalledWith("j1", "completed")
    runtime.shutdown()
  })

  it("marks job as failed when no handler is found", async () => {
    const job = { id: "j2", type: "unknown-job", payload: {}, retries: 0 }
    repo.findPending.mockReturnValue(mockEffect([job]))
    repo.updateStatus.mockReturnValue(mockEffect(undefined))
    runtime.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(repo.updateStatus).toHaveBeenCalledWith("j2", "failed")
    runtime.shutdown()
  })

  it("marks job as failed when handler throws", async () => {
    const errorHandler: JobHandler = {
      type: "failing-job",
      handle: vi.fn().mockReturnValue(Effect.fail(new Error("handler error"))),
    }
    runtime = new WorkerRuntime(repo as any, [errorHandler], {
      pollIntervalMs: 1000,
      maxConcurrency: 3,
    })
    const job = { id: "j3", type: "failing-job", payload: {}, retries: 0 }
    repo.findPending.mockReturnValue(mockEffect([job]))
    repo.updateStatus.mockReturnValue(mockEffect(undefined))
    runtime.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(repo.updateStatus).toHaveBeenCalledWith("j3", "running")
    await vi.advanceTimersByTimeAsync(0)
    expect(repo.updateStatus).toHaveBeenCalledWith("j3", "failed")
    runtime.shutdown()
  })

  it("does not exceed maxConcurrency", async () => {
    const jobs = Array.from({ length: 5 }, (_, i) => ({
      id: `j${i}`,
      type: "test-job",
      payload: {},
      retries: 0,
    }))
    const slowHandler: JobHandler = {
      type: "test-job",
      handle: vi.fn().mockReturnValue(Effect.never),
    }
    runtime = new WorkerRuntime(repo as any, [slowHandler], {
      pollIntervalMs: 1000,
      maxConcurrency: 3,
    })
    repo.findPending.mockReturnValue(mockEffect(jobs))
    repo.updateStatus.mockReturnValue(mockEffect(undefined))
    runtime.start()
    await vi.advanceTimersByTimeAsync(0)
    const runningCalls = repo.updateStatus.mock.calls.filter(
      (call: any[]) => call[1] === "running"
    )
    expect(runningCalls.length).toBe(3)
    runtime.shutdown()
  })

  it("shutdown stops polling", () => {
    repo.findPending.mockReturnValue(mockEffect([]))
    runtime.start()
    expect(repo.findPending).toHaveBeenCalledTimes(1)
    runtime.shutdown()
    vi.advanceTimersByTime(5000)
    expect(repo.findPending).toHaveBeenCalledTimes(1)
  })

  it("does not poll when not running", async () => {
    repo.findPending.mockReturnValue(mockEffect([]))
    await vi.advanceTimersByTimeAsync(1000)
    expect(repo.findPending).not.toHaveBeenCalled()
  })
})
