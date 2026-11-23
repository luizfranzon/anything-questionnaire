import type { UsageBucket, UsageMetrics } from "@anything-questionnaire/engine";
import type { CacheHitRow } from "@anything-questionnaire/ui/components/Metrics/CacheHitRate.tsx";
import type { ChartDay } from "@anything-questionnaire/ui/components/Metrics/TokenCostChart.tsx";
import { formatTokensCompact } from "@anything-questionnaire/ui/components/Metrics/format.ts";
import type { MetricsData } from "@anything-questionnaire/ui/screens/Metrics/MetricsScreen.tsx";
import { STAGE_BY_SCREEN_ID } from "./stages";

const SCREEN_ID_BY_STAGE = Object.fromEntries(Object.entries(STAGE_BY_SCREEN_ID).map(([id, stage]) => [stage, id]));
const STAGE_LABELS: Record<string, string> = {
  topics: "Extração de Tópicos",
  chunks: "Classificação de Trechos",
  generate: "Geração de Perguntas",
  blind: "Resolução às cegas",
  contest: "Julgamento de Contestação",
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAY_MS = 86_400_000;

const allTokens = (b: UsageBucket) => b.inputTokens + b.outputTokens + b.cacheReadTokens + b.cacheWriteTokens;

/** Every UTC day from `from` to `to` (`aaaa-mm-dd`), so quiet days show as empty columns instead of vanishing. */
function daysBetween(from: string, to: string): string[] {
  const days: string[] = [];
  for (let t = Date.parse(from); t <= Date.parse(to); t += DAY_MS) days.push(new Date(t).toISOString().slice(0, 10));
  return days;
}

function toChartDay(date: string, points: UsageMetrics["series"]): ChartDay {
  const [yyyy, mm, dd] = date.split("-");
  const values: ChartDay["values"] = {};
  for (const point of points.filter((p) => p.date === date)) {
    values[SCREEN_ID_BY_STAGE[point.stage]] = { tokens: allTokens(point), cost: point.costUsd };
  }
  const weekday = WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
  return { id: date, label: `${dd}/${mm}`, longLabel: `${weekday}, ${dd}/${mm}/${yyyy}`, values };
}

function toCacheRow(id: string, bucket: UsageMetrics["byStage"][number] | undefined): CacheHitRow {
  const label = STAGE_LABELS[id];
  if (!bucket || bucket.cacheHitRate === null) return { id, label, rate: null, detail: "Sem leitura nem gravação de cache" };
  const inputSide = bucket.inputTokens + bucket.cacheReadTokens + bucket.cacheWriteTokens;
  return {
    id,
    label,
    rate: bucket.cacheHitRate,
    detail: `${formatTokensCompact(bucket.cacheReadTokens)} de ${formatTokensCompact(inputSide)} lidos do cache`,
  };
}

/** Shapes the engine's metrics for the Métricas screen. `from` and `to` are the filtered period, `aaaa-mm-dd`. */
export function toMetricsData(metrics: UsageMetrics, period: { from: string; to: string }): MetricsData {
  const { totals } = metrics;
  return {
    totals: {
      input: totals.inputTokens,
      output: totals.outputTokens,
      cacheRead: totals.cacheReadTokens,
      cacheWrite: totals.cacheWriteTokens,
      cost: totals.costUsd,
    },
    days: daysBetween(period.from, period.to).map((date) => toChartDay(date, metrics.series)),
    cache: Object.entries(STAGE_BY_SCREEN_ID).map(([id, stage]) =>
      toCacheRow(id, metrics.byStage.find((b) => b.stage === stage)),
    ),
  };
}
