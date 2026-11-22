import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ChartDay } from "../../components/Metrics/TokenCostChart";
import { METRIC_STAGES, MetricsScreen, type MetricsData } from "./MetricsScreen";

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
    for (const s of METRIC_STAGES) {
      if (only && s.id !== only) continue;
      const tokens = i % 6 === 5 ? 0 : weights[s.id];
      values[s.id] = { tokens, cost: tokens * PRICE_PER_TOKEN };
    }
    return { id: `${mm}-${dd}`, label: `${dd}/${mm}`, longLabel: `${weekdays[date.getDay()]}, ${dd}/${mm}`, values };
  });
}

const data: MetricsData = {
  totals: { input: 2_480_000, output: 612_000, cacheRead: 1_930_000, cacheWrite: 318_000, cost: 14.82 },
  days: makeDays(30),
  cache: [
    { id: "topics", label: "Extração de Tópicos", rate: 0.12, detail: "190 mil de 1,6 mi lidos do cache" },
    { id: "chunks", label: "Classificação de Trechos", rate: 0.64, detail: "1,0 mi de 1,6 mi lidos do cache" },
    { id: "generate", label: "Geração de Perguntas", rate: 0.81, detail: "2,4 mi de 3,0 mi lidos do cache" },
    { id: "blind", label: "Resolução às cegas", rate: 0.05, detail: "34 mil de 680 mil lidos do cache" },
    { id: "contest", label: "Julgamento de Contestação", rate: null, detail: "Sem leitura nem gravação de cache" },
  ],
};

const zero: MetricsData = {
  totals: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0 },
  days: [],
  cache: [],
};

const meta = {
  title: "Telas/Métricas",
  component: MetricsScreen,
  parameters: { layout: "fullscreen" },
  args: { data },
} satisfies Meta<typeof MetricsScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const TabelaEquivalente: Story = { args: { initialView: "table" } };
export const FiltradoPorEtapa: Story = {
  args: {
    initialFilters: { period: "30d", from: "2026-10-24", to: "2026-11-22", study: "all", stage: "generate" },
    data: {
      totals: { input: 1_400_000, output: 380_000, cacheRead: 1_300_000, cacheWrite: 90_000, cost: 8.1 },
      days: makeDays(30, "generate"),
      cache: [data.cache[2]],
    },
  },
};
export const FiltradoPorEstudoLongo: Story = {
  args: {
    initialFilters: { period: "7d", from: "2026-11-16", to: "2026-11-22", study: "concurso", stage: "all" },
    data: { ...data, days: makeDays(7) },
  },
};
export const Carregando: Story = { args: { status: "loading", data: undefined } };
export const Recarregando: Story = { args: { status: "refetching" } };
export const NaoCarregou: Story = { args: { status: "error", data: undefined } };
export const SemConsumoNoPeriodo: Story = { args: { data: zero } };
