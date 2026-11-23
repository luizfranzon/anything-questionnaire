import { DomainError } from "./errors";

export const ROUND_COUNT_MIN = 1;
export const ROUND_COUNT_MAX = 100;

/** `study`: correction after each Answer. `mock` (simulado): everything is held back until the Round ends. */
export type RoundMode = "study" | "mock";
export type Confidence = "sure" | "doubt";
/** `partial` is reserved for open answers; multiple choice is only correct or incorrect. */
export type AnswerOutcome = "correct" | "partial" | "incorrect";

export type RoundPhase = "generating" | "retrying" | "failed" | "ready" | "in-progress" | "completed";

export interface Round {
  id: string;
  studyId: string;
  mode: RoundMode;
  count: number;
  phase: RoundPhase;
  /** Questions already generated for the Round. */
  generated: number;
  answered: number;
}

export interface RoundSettings {
  count: number;
  mode?: RoundMode;
  /** Restricts the Round to these Topics. Empty or absent means every active Topic. */
  topicIds?: string[];
}

export function validateRoundCount(count: number): number {
  if (!Number.isInteger(count) || count < ROUND_COUNT_MIN || count > ROUND_COUNT_MAX) {
    throw new DomainError("ROUND_COUNT_INVALID");
  }
  return count;
}

/** Splits `count` as evenly as possible; earlier Topics take the remainder. */
export function distributeEvenly(count: number, slots: number): number[] {
  const base = Math.floor(count / slots);
  const extra = count % slots;
  return Array.from({ length: slots }, (_, i) => base + (i < extra ? 1 : 0));
}

/** Orders items so that consecutive ones come from different groups where possible. */
export function interleave<T>(groups: T[][]): T[] {
  const result: T[] = [];
  const longest = Math.max(0, ...groups.map((g) => g.length));
  for (let i = 0; i < longest; i++) for (const g of groups) if (i < g.length) result.push(g[i]);
  return result;
}
