import { PgBoss } from "pg-boss";
import type { JobPhase, ProposalQueue } from "../../application/ports/topic-proposal-ports";

const QUEUE = "topic-proposal";

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

/** pg-boss keeps jobs in Postgres, so they survive closing the tab and restarting the container. */
export async function createPgBossProposalQueue(
  databaseUrl: string,
  overrides: Partial<QueueOptions> = {},
): Promise<ProposalQueue & { stop(): Promise<void> }> {
  const options = { ...defaultQueueOptions, ...overrides };
  const boss = new PgBoss(databaseUrl);
  boss.on("error", (error) => console.error("pg-boss:", error));
  await boss.start();
  await boss.createQueue(QUEUE, {
    retryLimit: options.retryLimit,
    retryDelay: options.retryDelaySeconds,
    retryBackoff: options.retryDelaySeconds > 0,
  });

  return {
    async enqueue(proposalId) {
      const id = await boss.send(QUEUE, { proposalId });
      if (!id) throw new Error("Could not enqueue the topic proposal job.");
      return id;
    },

    async phaseOf(jobId): Promise<JobPhase> {
      const job = await boss.getJobById<{ proposalId: string }>(QUEUE, jobId);
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
      await boss.work<{ proposalId: string }>(
        QUEUE,
        { batchSize: 1, pollingIntervalSeconds: options.pollingIntervalSeconds },
        async ([job]) => handler(job.data.proposalId),
      );
    },

    async drain() {
      await boss.drain(QUEUE);
    },

    stop: () => boss.stop({ graceful: true }),
  };
}
