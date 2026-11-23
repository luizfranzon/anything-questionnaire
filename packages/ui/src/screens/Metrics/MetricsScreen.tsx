import { useState } from "react";
import { AppShell } from "../../components/AppShell/AppShell";
import { CacheHitRate, type CacheHitRow } from "../../components/Metrics/CacheHitRate";
import { FilterBar, type MetricsFilterValue } from "../../components/Metrics/FilterBar";
import { StatTile } from "../../components/Metrics/StatTile";
import { TokenCostChart, type ChartDay, type ChartStage } from "../../components/Metrics/TokenCostChart";
import { formatCost, formatTokens, formatTokensCompact } from "../../components/Metrics/format";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import "./MetricsScreen.css";

export interface MetricsTotals {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
}

export interface MetricsData {
  totals: MetricsTotals;
  days: ChartDay[];
  cache: CacheHitRow[];
}

export const METRIC_STAGES: ChartStage[] = [
  { id: "topics", label: "Extração de Tópicos" },
  { id: "chunks", label: "Classificação de Trechos" },
  { id: "generate", label: "Geração de Perguntas" },
  { id: "blind", label: "Resolução às cegas" },
  { id: "contest", label: "Julgamento de Contestação" },
];

export const METRIC_STUDIES = [
  { value: "aws", label: "Certificação AWS Solutions Architect" },
  { value: "concurso", label: "Preparação para o concurso de analista de tecnologia da informação do tribunal regional federal" },
  { value: "rust", label: "Rust para sistemas" },
];

export interface MetricsScreenProps {
  /**
   * - `loading`: primeira carga.
   * - `refetching`: recarregando depois de mudar um filtro; mantém o que estava na tela, mais claro.
   * - `error`: não carregou.
   */
  status?: "ready" | "loading" | "refetching" | "error";
  data?: MetricsData;
  initialFilters?: MetricsFilterValue;
  /** Estudos do filtro. Padrão: os de exemplo do Storybook. */
  studies?: { value: string; label: string }[];
  /** Hoje, `aaaa-mm-dd`: o calendário não deixa escolher depois dele. */
  today?: string;
  /** Chamado a cada mudança de filtro, para a rota recarregar os números. */
  onFiltersChange?: (filters: MetricsFilterValue) => void;
  /** Abre o gráfico direto na tabela equivalente. */
  initialView?: "chart" | "table";
  onRetry?: () => void;
}

const DEFAULT_FILTERS: MetricsFilterValue = {
  period: "30d",
  from: "2026-10-24",
  to: "2026-11-22",
  study: "all",
  stage: "all",
};

/** Ticket 20: tokens, custo e cache por Etapa. Só leitura, sem ação primária. */
export function MetricsScreen({
  status = "ready",
  data,
  initialFilters = DEFAULT_FILTERS,
  studies = METRIC_STUDIES,
  today = "2026-11-22",
  onFiltersChange,
  initialView,
  onRetry,
}: MetricsScreenProps) {
  const [filters, setFilters] = useState(initialFilters);
  const changeFilters = (next: MetricsFilterValue) => {
    setFilters(next);
    onFiltersChange?.(next);
  };
  const loading = status === "loading";
  const error = status === "error";
  const refetching = status === "refetching";
  const totals = data?.totals;
  const empty = !!totals && totals.input + totals.output + totals.cacheRead + totals.cacheWrite === 0;

  const tile = (label: string, n: number | undefined) => ({
    label,
    value: n === undefined ? "" : formatTokensCompact(n),
    detail: n === undefined ? undefined : `${formatTokens(n)} tokens`,
  });

  return (
    <AppShell current="metrics" width="wide">
      <PageHeader title="Métricas" description="Tokens, custo estimado e uso de cache de cada Etapa." />

      <div className="metrics__stack">
        <FilterBar
          value={filters}
          onChange={changeFilters}
          studies={studies}
          stages={METRIC_STAGES.map((s) => ({ value: s.id, label: s.label }))}
          today={today}
          loading={loading}
        />

        <section className="metrics__tiles" aria-label="Totais do período">
          <StatTile {...tile("Tokens de entrada", totals?.input)} loading={loading} error={error} />
          <StatTile {...tile("Tokens de saída", totals?.output)} loading={loading} error={error} />
          <StatTile {...tile("Lidos do cache", totals?.cacheRead)} loading={loading} error={error} />
          <StatTile {...tile("Gravados no cache", totals?.cacheWrite)} loading={loading} error={error} />
          <StatTile
            label="Custo estimado"
            value={totals ? formatCost(totals.cost) : ""}
            detail={totals ? "No período" : undefined}
            emphasis
            loading={loading}
            error={error}
          />
        </section>

        <TokenCostChart
          stages={METRIC_STAGES}
          days={empty ? [] : (data?.days ?? [])}
          loading={loading}
          refetching={refetching}
          error={error}
          onRetry={onRetry}
          defaultView={initialView}
        />

        <CacheHitRate
          rows={empty ? [] : (data?.cache ?? [])}
          loading={loading}
          refetching={refetching}
          error={error}
          onRetry={onRetry}
        />
      </div>
    </AppShell>
  );
}
