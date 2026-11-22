import { createEmptyCard, fsrs, Rating, type Card, type Grade } from "ts-fsrs";
import type { AnswerOutcome, Confidence } from "./round";

/** Tunables that will become user Settings later. */
export const REVIEW_DEFAULTS = {
  /** The largest share of a Round that Revisões may take. */
  maxFraction: 0.3,
} as const;

export type ReviewGrade = "again" | "hard" | "good";

export interface ReviewAnswer {
  outcome: AnswerOutcome;
  confidence: Confidence | null;
  answeredAt: Date;
}

// No sub-day (re)learning steps: a Question is either due on some later day or scheduled, never "again in 10 minutes".
const scheduler = fsrs({ enable_fuzz: false, enable_short_term: false });

/** A mistake or "Não sei" is "Errei"; a hit in doubt is "Difícil"; a sure hit (or one with no Confidence yet) is "Bom". */
export function gradeFor(answer: Pick<ReviewAnswer, "outcome" | "confidence">): ReviewGrade {
  if (answer.outcome === "incorrect") return "again";
  if (answer.outcome === "partial") return "hard";
  return answer.confidence === "doubt" ? "hard" : "good";
}

const RATINGS: Record<ReviewGrade, Grade> = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good };

/**
 * The FSRS card of a Question after all its Answers. Replayed from the history each time, so declaring
 * Confidence after the Answer (or changing it) is reflected without special cases.
 */
export function scheduleFromHistory(answers: ReviewAnswer[]): Card | null {
  const ordered = [...answers].sort((a, b) => a.answeredAt.getTime() - b.answeredAt.getTime());
  if (ordered.length === 0) return null;
  let card = createEmptyCard(ordered[0].answeredAt);
  for (const answer of ordered) card = scheduler.next(card, answer.answeredAt, RATINGS[gradeFor(answer)]).card;
  return card;
}

/** How many Revisões fit in a Round of `count`. */
export function reviewSlots(count: number, maxFraction: number = REVIEW_DEFAULTS.maxFraction): number {
  return Math.floor(count * maxFraction);
}

/** Fisher-Yates with an injectable source of randomness. */
export function shuffleWith<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
