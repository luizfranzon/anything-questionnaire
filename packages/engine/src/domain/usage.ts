/** Each kind of work the engine does with Claude. Each has a configurable model and measured consumption. */
export type Stage =
  | "topic-extraction"
  | "excerpt-classification"
  | "question-generation"
  | "blind-resolution"
  | "contestation-judgment";

export const DEFAULT_MODEL = "claude-sonnet-5-5";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  /** `null` when the adapter does not report it, which is not the same as zero. */
  cacheReadTokens: number | null;
  cacheWriteTokens: number | null;
}

/** One entry per Claude call. */
export interface UsageRecord extends TokenUsage {
  stage: Stage;
  model: string;
  studyId: string | null;
  /** The Round the call served, when there is one. */
  roundId: string | null;
  createdAt: Date;
}
