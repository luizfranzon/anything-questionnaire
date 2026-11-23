import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ClaudeGateway } from "./application/ports/claude-gateway";
import type { Random } from "./domain/performance";
import { systemClock, type Clock } from "./application/ports/clock";
import { createRoundUseCases } from "./application/use-cases/round-use-cases";
import { createStudyUseCases } from "./application/use-cases/study-use-cases";
import { createTopicProposalUseCases } from "./application/use-cases/topic-proposal-use-cases";
import {
  createAnthropicClaudeGateway,
  createUnconfiguredClaudeGateway,
} from "./infrastructure/claude/anthropic-claude-gateway";
import { createDrizzleRoundRepository } from "./infrastructure/db/drizzle-round-repository";
import {
  createDrizzleProposalRepository,
  createDrizzleTopicRepository,
  createDrizzleUsageRepository,
} from "./infrastructure/db/drizzle-topic-proposal-repositories";
import { createDrizzleStudyRepository } from "./infrastructure/db/drizzle-study-repository";
import { createPgBossJobQueues, type QueueOptions } from "./infrastructure/queue/pg-boss-job-queue";

export { runMigrations } from "./infrastructure/db/migrate";
export { DomainError, type DomainErrorCode } from "./domain/errors";
export {
  STUDY_GOAL_MAX_LENGTH,
  STUDY_NAME_MAX_LENGTH,
  type Study,
  type StudyDetails,
} from "./domain/study";
export { TOPIC_NAME_MAX_LENGTH, type ProposalPhase, type Topic, type TopicProposal } from "./domain/topic";
export {
  ROUND_COUNT_MAX,
  ROUND_COUNT_MIN,
  type AnswerOutcome,
  type Confidence,
  type Round,
  type RoundMode,
  type RoundPhase,
  type RoundSettings,
} from "./domain/round";
export type {
  Correction,
  CorrectionItem,
  GeneratedQuestion,
  NextQuestion,
  PresentedQuestion,
  RoundResult,
} from "./domain/question";
export {
  PERFORMANCE_DEFAULTS,
  type Difficulty,
  type Random,
  type Trend,
  type TopicPerformance,
} from "./domain/performance";
export { REVIEW_DEFAULTS } from "./domain/review";
export type { Stage, TokenUsage, UsageRecord } from "./domain/usage";
export type { ClaudeGateway } from "./application/ports/claude-gateway";
export type { Clock } from "./application/ports/clock";
export {
  createFakeClaudeGateway,
  sampleQuestion,
  type FakeClaudeGateway,
} from "./infrastructure/claude/fake-claude-gateway";

export interface EngineOptions {
  databaseUrl: string;
  /** Real adapter credentials. Ignored when `claude` is given. */
  anthropicApiKey?: string;
  /** Replaces the Claude gateway (tests pass the fake). */
  claude?: ClaudeGateway;
  clock?: Clock;
  /** Randomness for drawing Topics (`[0, 1)`). Tests pass a controllable one. */
  random?: Random;
  queue?: Partial<QueueOptions>;
}

/** Composition root: wires infrastructure adapters into the application use cases and starts the workers. */
export async function createEngine(options: EngineOptions) {
  const client = postgres(options.databaseUrl);
  const db = drizzle(client);
  const studies = createDrizzleStudyRepository(db);
  const queues = await createPgBossJobQueues(options.databaseUrl, options.queue);
  const claude =
    options.claude ??
    (options.anthropicApiKey
      ? createAnthropicClaudeGateway({ apiKey: options.anthropicApiKey })
      : createUnconfiguredClaudeGateway());
  const clock = options.clock ?? systemClock;
  const topics = createDrizzleTopicRepository(db);
  const usage = createDrizzleUsageRepository(db);

  const topicProposals = createTopicProposalUseCases({
    studies,
    proposals: createDrizzleProposalRepository(db),
    topics,
    usage,
    queue: await queues.queue("topic-proposal"),
    claude,
    clock,
  });
  const roundUseCases = createRoundUseCases({
    studies,
    topics,
    rounds: createDrizzleRoundRepository(db),
    usage,
    queue: await queues.queue("round-generation"),
    claude,
    clock,
    random: options.random,
  });
  await Promise.all([topicProposals.startWorker(), roundUseCases.startWorker()]);

  const { startWorker: _a, drainJobs: drainProposals, ...proposalOperations } = topicProposals;
  const { startWorker: _b, drainJobs: drainRounds, ...roundOperations } = roundUseCases;

  return {
    ...createStudyUseCases(studies),
    ...proposalOperations,
    ...roundOperations,
    /** Runs all ready jobs, including retries, to completion. Meant for tests and scripts. */
    async drainJobs(): Promise<void> {
      await drainProposals();
      await drainRounds();
    },
    async close(): Promise<void> {
      await queues.stop();
      await client.end();
    },
  };
}

export type Engine = Awaited<ReturnType<typeof createEngine>>;
