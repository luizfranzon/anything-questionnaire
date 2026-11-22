import type { AnswerOutcome, Confidence } from "./round";

/** Tunables that will become user Settings later. Everything that depends on them reads from here. */
export const PERFORMANCE_DEFAULTS = {
  /** How many of a Topic's most recent Answers make up its Desempenho. */
  window: 10,
  /** Lowest share of the strongest draw weight any active Topic keeps (0.1 = 10%). */
  minWeight: 0.1,
  /** What a correct Answer given in doubt is worth, against 1 for a sure one. */
  doubtCredit: 0.5,
  /** A Desempenho change of at least this much (0..1) between older and recent Answers is a trend. */
  trendThreshold: 0.1,
  /** Fewer Answers than this in the window are too few to call a trend. */
  trendMinAnswers: 4,
  /** Desempenho below this asks for easy Questions; from `hardFrom` up, hard ones. */
  easyBelow: 0.4,
  hardFrom: 0.75,
} as const;

export type PerformanceSettings = { -readonly [K in keyof typeof PERFORMANCE_DEFAULTS]: number };

export type Difficulty = "easy" | "medium" | "hard";
export type Trend = "up" | "down" | "steady";

export interface AnswerRecord {
  topicId: string;
  outcome: AnswerOutcome;
  confidence: Confidence | null;
  answeredAt: Date;
}

export interface TopicPerformance {
  topicId: string;
  name: string;
  /** 0..1, or null when the Topic was never asked. */
  performance: number | null;
  /** Null when there are too few recent Answers to tell. */
  trend: Trend | null;
  /** Change between the older and the recent Answers of the window, in percentage points. */
  delta: number | null;
  /** All Answers ever given to the Topic, not only the windowed ones. */
  answers: number;
}

/**
 * Credit of one Answer. "Não sei" and wrong Answers are 0. A correct one with no Confidence declared yet
 * counts as sure: the user simply did not say otherwise.
 */
export function answerCredit(answer: Pick<AnswerRecord, "outcome" | "confidence">, settings: PerformanceSettings): number {
  if (answer.outcome === "incorrect") return 0;
  if (answer.outcome === "partial") return 0.5;
  return answer.confidence === "doubt" ? settings.doubtCredit : 1;
}

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

/** Desempenho, trend and Answer count of one Topic from its Answers, in any order. */
export function measureTopic(
  topic: { id: string; name: string },
  answers: AnswerRecord[],
  settings: PerformanceSettings,
): TopicPerformance {
  const recent = answers
    .filter((a) => a.topicId === topic.id)
    .sort((a, b) => b.answeredAt.getTime() - a.answeredAt.getTime());
  const total = recent.length;
  if (total === 0) return { topicId: topic.id, name: topic.name, performance: null, trend: null, delta: null, answers: 0 };

  const credits = recent.slice(0, settings.window).map((a) => answerCredit(a, settings));
  const performance = mean(credits);
  if (credits.length < settings.trendMinAnswers) {
    return { topicId: topic.id, name: topic.name, performance, trend: null, delta: null, answers: total };
  }
  // `credits` is newest first: the first half is the recent one.
  const split = Math.floor(credits.length / 2);
  const change = mean(credits.slice(0, split)) - mean(credits.slice(split));
  const trend: Trend = change >= settings.trendThreshold ? "up" : change <= -settings.trendThreshold ? "down" : "steady";
  return { topicId: topic.id, name: topic.name, performance, trend, delta: Math.round(change * 100), answers: total };
}

/** Never-asked Topics first (they have priority), then from the weakest to the strongest. Ties keep their order. */
export function sortWeakestFirst<T extends { performance: number | null }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (a.item.performance ?? -1) - (b.item.performance ?? -1) || a.index - b.index)
    .map(({ item }) => item);
}

/** The Dificuldade asked of Claude: stronger Topics get harder Questions. */
export function difficultyFor(performance: number | null, settings: PerformanceSettings): Difficulty {
  if (performance === null) return "medium";
  if (performance < settings.easyBelow) return "easy";
  return performance >= settings.hardFrom ? "hard" : "medium";
}

/** Randomness source, `[0, 1)`. Replaced in tests. */
export type Random = () => number;

function pickWeighted(weights: number[], random: Random): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let point = random() * total;
  for (const [index, weight] of weights.entries()) {
    point -= weight;
    if (point < 0) return index;
  }
  return weights.length - 1;
}

/**
 * Splits `count` new Questions among Topics. Never-asked Topics come first: each takes one Question
 * before anything else is drawn. The rest are drawn one by one with weight `1 - Desempenho`, never
 * below `minWeight`, so even a strong Topic keeps showing up. Returns the count per input position.
 */
export function allocateQuestions(
  count: number,
  topics: Array<{ performance: number | null }>,
  random: Random,
  settings: PerformanceSettings,
): number[] {
  const allocation = topics.map(() => 0);
  let remaining = count;

  const neverAsked = topics.flatMap((t, i) => (t.performance === null ? [i] : []));
  // Fisher-Yates, so that when there are more never-asked Topics than Questions the cut is not always the same.
  for (let i = neverAsked.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [neverAsked[i], neverAsked[j]] = [neverAsked[j], neverAsked[i]];
  }
  for (const index of neverAsked) {
    if (remaining === 0) break;
    allocation[index]++;
    remaining--;
  }

  const weights = topics.map((t) => (t.performance === null ? 1 : Math.max(1 - t.performance, settings.minWeight)));
  while (remaining-- > 0) allocation[pickWeighted(weights, random)]++;
  return allocation;
}
