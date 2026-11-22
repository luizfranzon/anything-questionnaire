import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CacheHitRate, type CacheHitRow } from "./CacheHitRate";
import { FilterBar, defaultMetricsFilters, type MetricsFilterValue } from "./FilterBar";
import { StatTile } from "./StatTile";
import { TokenCostChart, type ChartDay, type ChartStage } from "./TokenCostChart";
import { formatCost, formatPercent, formatTokens, formatTokensCompact } from "./format";

const stages: ChartStage[] = [
  { id: "topics", label: "Extração de Tópicos" },
  { id: "chunks", label: "Classificação de Trechos" },
  { id: "generate", label: "Geração de Perguntas" },
  { id: "blind", label: "Resolução às cegas" },
  { id: "contest", label: "Julgamento de Contestação" },
];

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const PRICE_PER_TOKEN = 9 / 1_000_000;

function makeDays(n: number, only?: string): ChartDay[] {
  return Array.from({ length: n }, (_, i) => {
    const date = new Date(2026, 10, 22 - (n - 1 - i));
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const weights: Record<string, number> = {
      topics: 40_000 + ((i * 7) % 5) * 9_000,
      chunks: 90_000 + ((i * 11) % 6) * 20_000,
      generate: 260_000 + ((i * 13) % 7) * 70_000,
      blind: 150_000 + ((i * 5) % 4) * 40_000,
      contest: i % 4 === 0 ? 0 : 20_000 + ((i * 3) % 3) * 8_000,
    };
    const values: ChartDay["values"] = {};
    for (const s of stages) {
      if (only && s.id !== only) continue;
      const tokens = i % 6 === 5 ? 0 : weights[s.id];
      values[s.id] = { tokens, cost: tokens * PRICE_PER_TOKEN };
    }
    return { id: `${mm}-${dd}`, label: `${dd}/${mm}`, longLabel: `${weekdays[date.getDay()]}, ${dd}/${mm}`, values };
  });
}

const meta = {
  title: "Componentes/Métricas",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const wide: React.CSSProperties = { maxWidth: "var(--width-content)" };

/* ---------- StatTile ---------- */

const tiles = [
  { label: "Tokens de entrada", value: formatTokensCompact(2_480_000), detail: `${formatTokens(2_480_000)} tokens` },
  { label: "Tokens de saída", value: formatTokensCompact(612_000), detail: `${formatTokens(612_000)} tokens` },
  { label: "Lidos do cache", value: formatTokensCompact(1_930_000), detail: `${formatTokens(1_930_000)} tokens` },
  { label: "Gravados no cache", value: formatTokensCompact(318_000), detail: `${formatTokens(318_000)} tokens` },
  { label: "Custo estimado", value: formatCost(14.82), detail: "No período", emphasis: true },
];
const row5: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "var(--space-3)", ...wide };

export const Totais: Story = {
  render: () => (
    <div style={row5}>
      {tiles.map((t) => (
        <StatTile key={t.label} {...t} />
      ))}
    </div>
  ),
};
export const TotaisCarregando: Story = {
  render: () => (
    <div style={row5}>
      {tiles.map((t) => (
        <StatTile key={t.label} label={t.label} value="" loading emphasis={t.emphasis} />
      ))}
    </div>
  ),
};
export const TotaisNaoCarregou: Story = {
  render: () => (
    <div style={row5}>
      {tiles.map((t) => (
        <StatTile key={t.label} label={t.label} value="" error emphasis={t.emphasis} />
      ))}
    </div>
  ),
};
export const TotaisZerados: Story = {
  render: () => (
    <div style={row5}>
      {tiles.map((t, i) => (
        <StatTile key={t.label} label={t.label} value={i === 4 ? formatCost(0) : "0"} detail={i === 4 ? "No período" : "0 tokens"} emphasis={t.emphasis} />
      ))}
    </div>
  ),
};
export const TotalComNumeroGrande: Story = {
  render: () => (
    <div style={{ width: 240 }}>
      <StatTile label="Tokens de entrada" value={formatTokensCompact(1_284_000_000)} detail={`${formatTokens(1_284_000_000)} tokens`} />
    </div>
  ),
};

/* ---------- TokenCostChart ---------- */

const chartDays = makeDays(14);

export const GraficoTokens: Story = { render: () => <div style={wide}><TokenCostChart stages={stages} days={chartDays} /></div> };
export const GraficoCusto: Story = { render: () => <div style={wide}><TokenCostChart stages={stages} days={chartDays} defaultMetric="cost" /></div> };
/** O tooltip lista todas as Etapas do dia, com o valor em destaque. */
export const GraficoComTooltip: Story = {
  render: () => <div style={{ ...wide, minHeight: 520 }}><TokenCostChart stages={stages} days={chartDays} forceHover={4} /></div>,
};
export const GraficoTooltipNaDireita: Story = {
  render: () => <div style={{ ...wide, minHeight: 520 }}><TokenCostChart stages={stages} days={chartDays} forceHover={11} /></div>,
};
/** 90 dias: colunas finas, rótulos do eixo espaçados. */
export const GraficoNoventaDias: Story = { render: () => <div style={wide}><TokenCostChart stages={stages} days={makeDays(90)} /></div> };
/** Filtro por Etapa: as cores das Etapas que sobram não mudam. */
export const GraficoFiltradoPorEtapa: Story = { render: () => <div style={wide}><TokenCostChart stages={stages} days={makeDays(14, "generate")} /></div> };
export const GraficoUmDia: Story = { render: () => <div style={wide}><TokenCostChart stages={stages} days={makeDays(1)} /></div> };
export const GraficoComoTabela: Story = { render: () => <div style={wide}><TokenCostChart stages={stages} days={chartDays} defaultView="table" /></div> };
export const GraficoCarregando: Story = { render: () => <div style={wide}><TokenCostChart stages={stages} days={[]} loading /></div> };
export const GraficoRecarregando: Story = { render: () => <div style={wide}><TokenCostChart stages={stages} days={chartDays} refetching /></div> };
export const GraficoVazio: Story = { render: () => <div style={wide}><TokenCostChart stages={stages} days={[]} /></div> };
export const GraficoNaoCarregou: Story = { render: () => <div style={wide}><TokenCostChart stages={stages} days={[]} error onRetry={() => {}} /></div> };

/* ---------- CacheHitRate ---------- */

const cacheRows: CacheHitRow[] = [
  { id: "topics", label: "Extração de Tópicos", rate: 0.12, detail: "48 mil de 400 mil lidos do cache" },
  { id: "chunks", label: "Classificação de Trechos", rate: 0.64 },
  { id: "generate", label: "Geração de Perguntas", rate: 0.87 },
  { id: "blind", label: "Resolução às cegas", rate: 0.91 },
  { id: "contest", label: "Julgamento de Contestação", rate: null },
];
export const TaxaDeCache: Story = { render: () => <CacheHitRate rows={cacheRows} /> };
export const TaxaDeCacheCarregando: Story = { render: () => <CacheHitRate rows={[]} loading /> };
export const TaxaDeCacheRecarregando: Story = { render: () => <CacheHitRate rows={cacheRows} refetching /> };
export const TaxaDeCacheVazia: Story = { render: () => <CacheHitRate rows={[]} /> };
export const TaxaDeCacheNaoCarregou: Story = { render: () => <CacheHitRate rows={[]} error onRetry={() => {}} /> };
export const TaxaDeCacheZerada: Story = {
  render: () => <CacheHitRate rows={cacheRows.map((r) => ({ ...r, rate: 0 }))} />,
};

/* ---------- FilterBar ---------- */

const studies = [
  { value: "aws", label: "AWS Solutions Architect" },
  { value: "net", label: "Redes e protocolos" },
  { value: "long", label: "Preparatório para o concurso do tribunal regional, edital de 2026" },
];
const stageOptions = stages.map((s) => ({ value: s.id, label: s.label }));

function Bar({ initial = defaultMetricsFilters, ...rest }: { initial?: MetricsFilterValue; loading?: boolean; disabled?: boolean }) {
  const [value, setValue] = useState(initial);
  return <FilterBar value={value} onChange={setValue} studies={studies} stages={stageOptions} today="2026-11-22" {...rest} />;
}

export const Filtros: Story = { render: () => <div style={{ minHeight: 300 }}><Bar /></div> };
export const FiltrosAplicados: Story = {
  render: () => <Bar initial={{ ...defaultMetricsFilters, period: "7d", study: "aws", stage: "generate" }} />,
};
export const FiltrosPeriodoPersonalizado: Story = {
  render: () => <Bar initial={{ ...defaultMetricsFilters, period: "custom", from: "2026-11-01", to: "2026-11-15" }} />,
};
export const FiltrosCarregando: Story = { render: () => <Bar loading /> };
export const FiltrosDesabilitados: Story = { render: () => <Bar disabled /> };

/* ---------- Tela de exemplo: tudo junto, filtros escopando o resto ---------- */

export const PaginaDeMetricas: Story = {
  render: function Render() {
    const [value, setValue] = useState<MetricsFilterValue>(defaultMetricsFilters);
    const days = makeDays(value.period === "7d" ? 7 : value.period === "90d" ? 90 : value.period === "today" ? 1 : 30, value.stage === "all" ? undefined : value.stage);
    const rows = value.stage === "all" ? cacheRows : cacheRows.filter((r) => r.id === value.stage);
    const sum = (k: "tokens" | "cost") => days.reduce((a, d) => a + Object.values(d.values).reduce((b, v) => b + v[k], 0), 0);
    const total = sum("tokens");
    return (
      <div style={{ display: "grid", gap: "var(--space-5)", ...wide }}>
        <FilterBar value={value} onChange={setValue} studies={studies} stages={stageOptions} today="2026-11-22" />
        <div style={row5}>
          <StatTile label="Tokens de entrada" value={formatTokensCompact(total * 0.7)} detail={`${formatTokens(Math.round(total * 0.7))} tokens`} />
          <StatTile label="Tokens de saída" value={formatTokensCompact(total * 0.3)} detail={`${formatTokens(Math.round(total * 0.3))} tokens`} />
          <StatTile label="Lidos do cache" value={formatTokensCompact(total * 0.5)} detail={formatPercent(0.5) + " da entrada"} />
          <StatTile label="Gravados no cache" value={formatTokensCompact(total * 0.08)} detail={`${formatTokens(Math.round(total * 0.08))} tokens`} />
          <StatTile label="Custo estimado" value={formatCost(sum("cost"))} detail="No período" emphasis />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: "var(--space-4)", alignItems: "start" }}>
          <TokenCostChart stages={stages} days={days} />
          <CacheHitRate rows={rows} />
        </div>
      </div>
    );
  },
};

