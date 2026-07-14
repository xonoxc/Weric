export interface StreamWriter {
  send(event: string, data: unknown): void
  close(): void
  onAbort(cb: () => void): void
}

class JobBus {
  private clientStreams = new Map<string, StreamWriter>()
  private workerStreams = new Set<StreamWriter>()

  registerClient(jobId: string, writer: StreamWriter): void {
    this.clientStreams.set(jobId, writer)
  }

  unregisterClient(jobId: string): void {
    this.clientStreams.delete(jobId)
  }

  registerWorker(writer: StreamWriter): void {
    this.workerStreams.add(writer)
  }

  unregisterWorker(writer: StreamWriter): void {
    this.workerStreams.delete(writer)
  }

  sendToClient(jobId: string, event: string, data: unknown): void {
    const writer = this.clientStreams.get(jobId)
    if (writer) {
      writer.send(event, data)
    }
  }

  closeClient(jobId: string): void {
    const writer = this.clientStreams.get(jobId)
    if (writer) {
      writer.close()
    }
  }

  sendJobToWorker(data: { id: string; type: string; payload: unknown }): void {
    for (const writer of this.workerStreams) {
      writer.send("new_job", data)
      return
    }
  }

  sendInitToWorkers(data: unknown[]): void {
    for (const writer of this.workerStreams) {
      writer.send("init", data)
    }
  }
}

export const jobBus = new JobBus()
