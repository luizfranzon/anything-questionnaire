import type { GeneratedQuestion } from "../../domain/question";
import type { TokenUsage } from "../../domain/usage";

export interface StageResult<T> {
  output: T;
  model: string;
  usage: TokenUsage;
}

export interface ExtractTopicsRequest {
  studyId: string;
  goal: string;
}

export interface GenerateQuestionsRequest {
  studyId: string;
  roundId: string;
  goal: string;
  topic: { id: string; name: string };
  /** How many Questions to write. Claude may return fewer or more; the engine copes. */
  count: number;
}

/** The API is temporarily overloaded. Transient: the job queue retries. */
export class ClaudeOverloadedError extends Error {
  constructor() {
    super("Claude is overloaded");
    this.name = "ClaudeOverloadedError";
  }
}

/** Port to Claude: one operation per Stage. More operations arrive with their tickets. */
export interface ClaudeGateway {
  extractTopics(request: ExtractTopicsRequest): Promise<StageResult<{ topics: string[] }>>;
  generateQuestions(request: GenerateQuestionsRequest): Promise<StageResult<{ questions: GeneratedQuestion[] }>>;
}
