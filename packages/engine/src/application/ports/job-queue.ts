export type JobPhase = "queued" | "running" | "retrying" | "completed" | "failed";

/** Persistent background queue. Each job carries the id of the record it works on. */
export interface JobQueue {
  enqueue(recordId: string): Promise<string>;
  phaseOf(jobId: string): Promise<JobPhase>;
  /** Registers the worker. Failures thrown by the handler are retried automatically. */
  work(handler: (recordId: string) => Promise<void>): Promise<void>;
  /** Runs every ready job (and retries) to completion. */
  drain(): Promise<void>;
}
