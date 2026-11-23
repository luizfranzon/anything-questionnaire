import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ClaudeGateway } from "./application/ports/claude-gateway";
import { createCredentialUseCases, type CredentialEnvironment } from "./application/use-cases/credential-use-cases";
import type { Credential, CredentialStatus } from "./domain/credential";
import { createFileKeyCipher } from "./infrastructure/crypto/file-key-cipher";
import { createDrizzleCredentialRepository } from "./infrastructure/db/drizzle-credential-repository";
import type { Random } from "./domain/performance";
import { systemClock, type Clock } from "./application/ports/clock";
import { createRoundUseCases } from "./application/use-cases/round-use-cases";
import { createSettingsUseCases } from "./application/use-cases/settings-use-cases";
import { createStudyUseCases } from "./application/use-cases/study-use-cases";
import { createDrizzleSettingsRepository } from "./infrastructure/db/drizzle-settings-repository";
import { createTopicProposalUseCases } from "./application/use-cases/topic-proposal-use-cases";
import { createAnthropicClaudeGateway } from "./infrastructure/claude/anthropic-claude-gateway";
import { createSubscriptionClaudeGateway } from "./infrastructure/claude/subscription-claude-gateway";
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
  RoundHistoryEntry,
  RoundResult,
  RoundReview,
} from "./domain/question";
export {
  PERFORMANCE_DEFAULTS,
  type Difficulty,
  type Random,
  type Trend,
  type TopicPerformance,
} from "./domain/performance";
export { REVIEW_DEFAULTS } from "./domain/review";
export { STAGES, type ModelPrice, type Settings } from "./domain/settings";
export type { Stage, TokenUsage, UsageRecord } from "./domain/usage";
export type { ClaudeGateway } from "./application/ports/claude-gateway";
export {
  ClaudeCredentialError,
  ClaudeNetworkError,
  ClaudeOverloadedError,
  ClaudeUsageLimitError,
} from "./application/ports/claude-gateway";
export type { Clock } from "./application/ports/clock";
export {
  createFakeClaudeGateway,
  sampleQuestion,
  type FakeClaudeGateway,
} from "./infrastructure/claude/fake-claude-gateway";

export type { Credential, AccessMethod, CredentialSource, CredentialStatus } from "./domain/credential";
export type { CredentialEnvironment } from "./application/use-cases/credential-use-cases";

function realGatewayFor(credential: Credential): ClaudeGateway {
  return credential.method === "api-key"
    ? createAnthropicClaudeGateway({ apiKey: credential.secret })
    : createSubscriptionClaudeGateway({ oauthToken: credential.secret });
}

export interface EngineOptions {
  databaseUrl: string;
  /**
   * How the engine gets its Credential: from the environment variables (which win) or the one saved in the wizard,
   * kept encrypted in the database with a master key in `dataDir`. Required unless `claude` is given.
   */
  credentials?: {
    env: CredentialEnvironment;
    /** Directory of the files volume, where the master key lives. */
    dataDir: string;
    /** Builds the adapter for a Credential. Defaults to the real adapters; tests answer with the fake. */
    gatewayFor?: (credential: Credential) => ClaudeGateway;
  };
  /** Replaces the Claude gateway and bypasses Credentials altogether (tests of other features pass the fake). */
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
  const clock = options.clock ?? systemClock;
  const topics = createDrizzleTopicRepository(db);
  const usage = createDrizzleUsageRepository(db);

  const { modelFor, cheapestModel, ...settingsOperations } = createSettingsUseCases(
    createDrizzleSettingsRepository(db),
  );

  let claude: ClaudeGateway;
  let requireCredential: () => Promise<void>;
  let credentialOperations: Pick<ReturnType<typeof createCredentialUseCases>, "getCredentialStatus" | "saveCredential">;
  if (options.claude) {
    claude = options.claude;
    requireCredential = async () => {};
    credentialOperations = {
      getCredentialStatus: async (): Promise<CredentialStatus> => ({
        configured: true,
        method: "api-key",
        masked: "",
        source: "environment",
      }),
      saveCredential: async () => {
        throw new Error("Credentials are not managed when a Claude gateway is injected.");
      },
    };
  } else {
    if (!options.credentials) throw new Error("createEngine needs `credentials` or `claude`.");
    const { env, dataDir, gatewayFor = realGatewayFor } = options.credentials;
    const managed = createCredentialUseCases({
      credentials: createDrizzleCredentialRepository(db),
      cipher: await createFileKeyCipher(dataDir),
      env,
      gatewayFor,
      cheapestModel,
    });
    claude = managed.gateway;
    requireCredential = managed.requireCredential;
    credentialOperations = { getCredentialStatus: managed.getCredentialStatus, saveCredential: managed.saveCredential };
  }

  const topicProposals = createTopicProposalUseCases({
    studies,
    proposals: createDrizzleProposalRepository(db),
    topics,
    usage,
    queue: await queues.queue("topic-proposal"),
    claude,
    modelFor,
    requireCredential,
    clock,
  });
  const roundUseCases = createRoundUseCases({
    studies,
    topics,
    rounds: createDrizzleRoundRepository(db),
    usage,
    queue: await queues.queue("round-generation"),
    claude,
    modelFor,
    requireCredential,
    clock,
    random: options.random,
  });
  await Promise.all([topicProposals.startWorker(), roundUseCases.startWorker()]);

  const { startWorker: _a, drainJobs: drainProposals, ...proposalOperations } = topicProposals;
  const { startWorker: _b, drainJobs: drainRounds, ...roundOperations } = roundUseCases;

  return {
    ...createStudyUseCases(studies),
    ...settingsOperations,
    ...credentialOperations,
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
