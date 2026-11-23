import { STAGES, type ModelPrice } from "./settings";
import type { Stage, UsageRecord } from "./usage";

export interface UsageBucket {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  /** Estimated, computed on the query from the current price table. */
  costUsd: number;
  /** Cache reads over every input-side token (fresh input, cache reads and cache writes). `null` when there were none. */
  cacheHitRate: number | null;
}

export interface UsageMetrics {
  totals: UsageBucket;
  /** Only the Stages that made calls, in pipeline order. */
  byStage: Array<UsageBucket & { stage: Stage }>;
  /** One point per UTC day and Stage that had calls, oldest day first. Feeds the chart. */
  series: Array<UsageBucket & { stage: Stage; date: string }>;
}

const PER_MILLION = 1_000_000;

export function costOf(record: UsageRecord, prices: Record<string, ModelPrice>): number {
  const price = prices[record.model];
  if (!price) return 0;
  return (
    (record.inputTokens * price.input +
      record.outputTokens * price.output +
      (record.cacheReadTokens ?? 0) * price.cacheRead +
      (record.cacheWriteTokens ?? 0) * price.cacheWrite) /
    PER_MILLION
  );
}

function sum(records: UsageRecord[], prices: Record<string, ModelPrice>): UsageBucket {
  const bucket: UsageBucket = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    costUsd: 0,
    cacheHitRate: null,
  };
  for (const record of records) {
    bucket.inputTokens += record.inputTokens;
    bucket.outputTokens += record.outputTokens;
    bucket.cacheReadTokens += record.cacheReadTokens ?? 0;
    bucket.cacheWriteTokens += record.cacheWriteTokens ?? 0;
    bucket.costUsd += costOf(record, prices);
  }
  const inputSide = bucket.inputTokens + bucket.cacheReadTokens + bucket.cacheWriteTokens;
  bucket.cacheHitRate = inputSide > 0 ? bucket.cacheReadTokens / inputSide : null;
  return bucket;
}

function byStageOf(records: UsageRecord[], prices: Record<string, ModelPrice>) {
  return STAGES.flatMap((stage) => {
    const ofStage = records.filter((record) => record.stage === stage);
    return ofStage.length > 0 ? [{ stage, ...sum(ofStage, prices) }] : [];
  });
}

export function buildUsageMetrics(records: UsageRecord[], prices: Record<string, ModelPrice>): UsageMetrics {
  const byStage = byStageOf(records, prices);
  const days = [...new Set(records.map((record) => record.createdAt.toISOString().slice(0, 10)))].sort();
  const series = days.flatMap((date) =>
    byStageOf(records.filter((record) => record.createdAt.toISOString().startsWith(date)), prices).map(
      (point) => ({ date, ...point }),
    ),
  );
  return { totals: sum(records, prices), byStage, series };
}
