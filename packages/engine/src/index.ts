import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ClaudeGateway } from "./application/ports/claude-gateway";
import { systemClock, type Clock } from "./application/ports/clock";
import { createStudyUseCases } from "./application/use-cases/study-use-cases";
import { createTopicProposalUseCases } from "./application/use-cases/topic-proposal-use-cases";
import {
  createAnthropicClaudeGateway,
  createUnconfiguredClaudeGateway,
} from "./infrastructure/claude/anthropic-claude-gateway";
import {
  createDrizzleProposalRepository,
  createDrizzleTopicRepository,
  createDrizzleUsageRepository,
} from "./infrastructure/db/drizzle-topic-proposal-repositories";
import { createDrizzleStudyRepository } from "./infrastructure/db/drizzle-study-repository";
import { createPgBossProposalQueue, type QueueOptions } from "./infrastructure/queue/pg-boss-proposal-queue";

export { runMigrations } from "./infrastructure/db/migrate";
export { DomainError, type DomainErrorCode } from "./domain/errors";
export {
  STUDY_GOAL_MAX_LENGTH,
  STUDY_NAME_MAX_LENGTH,
  type Study,
  type StudyDetails,
} from "./domain/study";
export { TOPIC_NAME_MAX_LENGTH, type ProposalPhase, type Topic, type TopicProposal } from "./domain/topic";
export type { Stage, TokenUsage, UsageRecord } from "./domain/usage";
export type { ClaudeGateway } from "./application/ports/claude-gateway";
export type { Clock } from "./application/ports/clock";
export { createFakeClaudeGateway, type FakeClaudeGateway } from "./infrastructure/claude/fake-claude-gateway";

export interface EngineOptions {
  databaseUrl: string;
  /** Real adapter credentials. Ignored when `claude` is given. */
  anthropicApiKey?: string;
  /** Replaces the Claude gateway (tests pass the fake). */
  claude?: ClaudeGateway;
  clock?: Clock;
  queue?: Partial<QueueOptions>;
}

/** Composition root: wires infrastructure adapters into the application use cases and starts the worker. */
export async function createEngine(options: EngineOptions) {
  const client = postgres(options.databaseUrl);
  const db = drizzle(client);
  const studies = createDrizzleStudyRepository(db);
  const queue = await createPgBossProposalQueue(options.databaseUrl, options.queue);
  const claude =
    options.claude ??
    (options.anthropicApiKey
      ? createAnthropicClaudeGateway({ apiKey: options.anthropicApiKey })
      : createUnconfiguredClaudeGateway());

  const topicProposals = createTopicProposalUseCases({
    studies,
    proposals: createDrizzleProposalRepository(db),
    topics: createDrizzleTopicRepository(db),
    usage: createDrizzleUsageRepository(db),
    queue,
    claude,
    clock: options.clock ?? systemClock,
  });
  await topicProposals.startWorker();

  return {
    ...createStudyUseCases(studies),
    ...topicProposals,
    async close(): Promise<void> {
      await queue.stop();
      await client.end();
    },
  };
}

export type Engine = Awaited<ReturnType<typeof createEngine>>;
