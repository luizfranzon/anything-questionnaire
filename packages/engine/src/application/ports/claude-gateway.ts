import type { GeneratedQuestion } from "../../domain/question";
import type { Difficulty } from "../../domain/performance";
import type { TokenUsage } from "../../domain/usage";

export interface StageResult<T> {
  output: T;
  model: string;
  usage: TokenUsage;
}

export interface ExtractTopicsRequest {
  /** The model configured for this Stage. */
  model: string;
  studyId: string;
  goal: string;
}

export interface GenerateQuestionsRequest {
  /** The model configured for this Stage. */
  model: string;
  studyId: string;
  roundId: string;
  goal: string;
  topic: { id: string; name: string };
  difficulty: Difficulty;
  /** How many Questions to write. Claude may return fewer or more; the engine copes. */
  count: number;
}

export interface ResolveBlindRequest {
  /** The model configured for this Stage. */
  model: string;
  studyId: string;
  roundId: string;
  /** Only statements and Alternativas: never the Gabarito or the Explicacoes. */
  questions: Array<{ prompt: string; alternatives: string[] }>;
}

/** The API is temporarily overloaded. Transient: the job queue retries. */
export class ClaudeOverloadedError extends Error {
  constructor() {
    super("Claude is overloaded");
    this.name = "ClaudeOverloadedError";
  }
}

/** The Credencial was rejected (invalid, expired or revoked). Retrying will not help until the user renews it. */
export class ClaudeCredentialError extends Error {
  constructor() {
    super("Claude rejected the credential");
    this.name = "ClaudeCredentialError";
  }
}

/** The usage limit of the plan or account was reached. `resetsAt` is when it renews, when Claude says so. */
export class ClaudeUsageLimitError extends Error {
  constructor(public readonly resetsAt?: Date) {
    super("Claude usage limit reached");
    this.name = "ClaudeUsageLimitError";
  }
}

/** Claude could not be reached. Transient. */
export class ClaudeNetworkError extends Error {
  constructor(cause?: unknown) {
    super("Could not reach Claude", { cause });
    this.name = "ClaudeNetworkError";
  }
}

/** Port to Claude: one operation per Stage. More operations arrive with their tickets. */
export interface ClaudeGateway {
  extractTopics(request: ExtractTopicsRequest): Promise<StageResult<{ topics: string[] }>>;
  generateQuestions(request: GenerateQuestionsRequest): Promise<StageResult<{ questions: GeneratedQuestion[] }>>;
  /**
   * Solves the whole batch in one call. `answers[i]` is the index (in the order sent) of the Alternative
   * chosen for `questions[i]`, or null when Claude could not choose.
   */
  resolveBlind(request: ResolveBlindRequest): Promise<StageResult<{ answers: Array<number | null> }>>;
}
