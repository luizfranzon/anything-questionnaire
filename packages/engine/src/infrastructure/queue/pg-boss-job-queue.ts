import { PgBoss } from "pg-boss";
import type { JobPhase, JobQueue } from "../../application/ports/job-queue";

export interface QueueOptions {
  retryLimit: number;
  /** Seconds before the first retry; doubles on each attempt. */
  retryDelaySeconds: number;
  pollingIntervalSeconds: number;
}

export const defaultQueueOptions: QueueOptions = {
  retryLimit: 5,
  retryDelaySeconds: 10,
  pollingIntervalSeconds: 2,
};

export interface JobQueues {
  /** Creates (idempotently) a named queue. */
  queue(name: string): Promise<JobQueue>;
  stop(): Promise<void>;
}

/** pg-boss keeps jobs in Postgres, so they survive closing the tab and restarting the container. */
export async function createPgBossJobQueues(
  databaseUrl: string,
  overrides: Partial<QueueOptions> = {},
): Promise<JobQueues> {
  const options = { ...defaultQueueOptions, ...overrides };
  const boss = new PgBoss(databaseUrl);
  boss.on("error", (error) => console.error("pg-boss:", error));
  await boss.start();

  return {
    async queue(name): Promise<JobQueue> {
      await boss.createQueue(name, {
        retryLimit: options.retryLimit,
        retryDelay: options.retryDelaySeconds,
        retryBackoff: options.retryDelaySeconds > 0,
      });
      return {
        async enqueue(recordId) {
          const id = await boss.send(name, { recordId });
          if (!id) throw new Error(`Could not enqueue a job on ${name}.`);
          return id;
        },

        async phaseOf(jobId): Promise<JobPhase> {
          const job = await boss.getJobById(name, jobId);
          if (!job) return "completed";
          switch (job.state) {
            case "created":
              return "queued";
            case "retry":
              return "retrying";
            case "active":
              return job.retryCount > 0 ? "retrying" : "running";
            case "completed":
              return "completed";
            default:
              return "failed";
          }
        },

        async work(handler) {
          await boss.work<{ recordId: string }>(
            name,
            { batchSize: 1, pollingIntervalSeconds: options.pollingIntervalSeconds },
            async ([job]) => {
              const label = `[job ${name}] record=${job.data.recordId} attempt=${job.retryCount + 1}`;
              const startedAt = Date.now();
              console.log(`${label} started`);
              try {
                await handler(job.data.recordId);
                console.log(`${label} completed in ${Date.now() - startedAt}ms`);
              } catch (error) {
                const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
                console.error(`${label} failed after ${Date.now() - startedAt}ms: ${message}`);
                throw error;
              }
            },
          );
        },

        async drain() {
          await boss.drain(name);
        },
      };
    },
    stop: () => boss.stop({ graceful: true }),
  };
}
