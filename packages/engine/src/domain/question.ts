import type { Difficulty } from "./performance";
import type { AnswerOutcome, Confidence } from "./round";

export type QuestionFormat = "multiple-choice" | "open";

export interface Alternative {
  id: string;
  text: string;
  /** Why this one is right, or why it is wrong. */
  explanation: string;
}

/** What Claude returns for one multiple-choice Question, before it gets ids. */
export interface GeneratedQuestion {
  prompt: string;
  alternatives: Array<{ text: string; explanation: string }>;
  correctIndex: number;
}

export interface NewQuestion {
  topicId: string;
  difficulty: Difficulty;
  format: QuestionFormat;
  prompt: string;
  alternatives: Alternative[];
  /** The correct Alternative's id (multiple choice) or the expected answer (open). */
  answerKey: string;
}

export const MIN_ALTERNATIVES = 2;
export const MAX_ALTERNATIVES = 6;

/** Keeps only what is a well-formed multiple-choice Question, and gives each Alternative an id. */
export function toNewQuestion(
  topicId: string,
  raw: GeneratedQuestion,
  difficulty: Difficulty,
  newId: () => string,
  shuffle: <T>(items: T[]) => T[],
): NewQuestion | null {
  const prompt = raw.prompt?.trim();
  const alternatives = raw.alternatives?.map((a) => ({ text: a.text?.trim(), explanation: a.explanation?.trim() }));
  if (!prompt || !alternatives) return null;
  if (alternatives.length < MIN_ALTERNATIVES || alternatives.length > MAX_ALTERNATIVES) return null;
  if (alternatives.some((a) => !a.text || !a.explanation)) return null;
  if (new Set(alternatives.map((a) => a.text!.toLowerCase())).size !== alternatives.length) return null;
  if (!Number.isInteger(raw.correctIndex) || raw.correctIndex < 0 || raw.correctIndex >= alternatives.length) return null;

  const withIds = alternatives.map((a) => ({ id: newId(), text: a.text!, explanation: a.explanation! }));
  const answerKey = withIds[raw.correctIndex].id;
  return { topicId, difficulty, format: "multiple-choice", prompt, alternatives: shuffle(withIds), answerKey };
}

/** The Question as presented to the user: no Gabarito, no Explicação. */
export interface PresentedQuestion {
  id: string;
  topic: string;
  format: QuestionFormat;
  prompt: string;
  alternatives: Array<{ id: string; text: string }>;
}

export interface NextQuestion {
  /** 1-based position in the Round. */
  position: number;
  total: number;
  question: PresentedQuestion;
}

export interface Correction {
  outcome: AnswerOutcome;
  correctAlternativeId: string;
  /** Explicação, per Alternative id. */
  explanations: Record<string, string>;
  confidence: Confidence | null;
}

export interface RoundResult {
  correct: number;
  total: number;
  dontKnow: number;
}
