import { useId, useState } from "react";
import { motion } from "motion/react";
import { ChartColumn, RotateCw, Table2 } from "lucide-react";
import { Button } from "../Button/Button";
import { EmptyState } from "../EmptyState/EmptyState";
import { Skeleton, SkeletonGroup } from "../Skeleton/Skeleton";
import { transition } from "../../motion";
import { formatCost, formatTokens, formatTokensCompact } from "./format";
import "./Metrics.css";

export type ChartMetric = "tokens" | "cost";

export interface ChartStage {
  id: string;
  label: string;
}

export interface ChartDay {
  id: string;
  /** Rótulo do eixo, ex.: "12/11". */
  label: string;
  /** Rótulo do tooltip e da tabela, ex.: "Terça, 12/11". Padrão: `label`. */
  longLabel?: string;
  /** Por Etapa. Etapa ausente conta zero. */
  values: Record<string, { tokens: number; cost: number }>;
}

export interface TokenCostChartProps {
  /** Todas as Etapas, sempre na mesma ordem: a cor é da Etapa (até cinco), mesmo se o filtro esconder as outras. */
  stages: ChartStage[];
  days: ChartDay[];
  metric?: ChartMetric;
  defaultMetric?: ChartMetric;
  onMetricChange?: (metric: ChartMetric) => void;
  /** Primeira carga: reserva o espaço do gráfico. */
  loading?: boolean;
  /** Recarregando depois de um filtro: mantém o gráfico anterior, mais claro, sem pular. */
  refetching?: boolean;
  /** Não carregou. `onRetry` mostra "Tentar de novo". */
  error?: boolean;
  onRetry?: () => void;
  /** Abre direto na tabela. */
  defaultView?: "chart" | "table";
  className?: string;
  /** Só para a matriz de estados do Storybook: mostra o tooltip desta coluna. */
  forceHover?: number;
}

const SLOTS = [1, 2, 3, 4, 5] as const;

function niceMax(v: number) {
  if (v <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(v));
  const f = v / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * exp;
}

const fmtAxis = (metric: ChartMetric, n: number) =>
  metric === "tokens" ? formatTokensCompact(n) : formatCost(n).replace(",00", "");
const fmtFull = (metric: ChartMetric, n: number) => (metric === "tokens" ? `${formatTokens(n)} tokens` : formatCost(n));
const valueOf = (d: ChartDay, stage: string, metric: ChartMetric) => d.values[stage]?.[metric] ?? 0;

/**
 * Tokens e custo por Etapa ao longo do tempo (ticket 20). Colunas empilhadas por dia, uma medida por vez
 * (nunca dois eixos), legenda sempre visível, tooltip por coluna e tabela equivalente.
 */
export function TokenCostChart({
  stages,
  days,
  metric: metricProp,
  defaultMetric = "tokens",
  onMetricChange,
  loading,
  refetching,
  error,
  onRetry,
  defaultView = "chart",
  className,
  forceHover,
}: TokenCostChartProps) {
  const uid = useId();
  const [inner, setInner] = useState<ChartMetric>(defaultMetric);
  const metric = metricProp ?? inner;
  const [view, setView] = useState(defaultView);
  const [hover, setHover] = useState<number | null>(null);
  const active = forceHover ?? hover;

  const pick = (m: ChartMetric) => {
    if (metricProp === undefined) setInner(m);
    onMetricChange?.(m);
  };

  const totals = days.map((d) => stages.reduce((sum, s) => sum + valueOf(d, s.id, metric), 0));
  const top = niceMax(Math.max(0, ...totals));
  const ticks = [top, top / 2, 0];
  const every = Math.max(1, Math.ceil(days.length / 10));
  const unitLabel = metric === "tokens" ? "tokens" : "US$";

  const header = (
    <div className="chart__head">
      <div>
        <h3 id={`${uid}-t`} className="metric-card__title">
          Consumo por Etapa
        </h3>
        <p className="metric-card__sub">{metric === "tokens" ? "Tokens por dia, de entrada e saída." : "Custo estimado por dia, em US$."}</p>
      </div>
      <div className="chart__controls">
        <div className="chart__toggle" role="group" aria-label="Medida do gráfico">
          {(["tokens", "cost"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className="chart__segbtn"
              aria-pressed={metric === m}
              onClick={() => pick(m)}
              disabled={loading || error}
            >
              {m === "tokens" ? "Tokens" : "Custo"}
            </button>
          ))}
        </div>
        <Button
          variant="link"
          icon={view === "chart" ? <Table2 size={16} aria-hidden /> : <ChartColumn size={16} aria-hidden />}
          onClick={() => setView(view === "chart" ? "table" : "chart")}
          disabled={loading || error || days.length === 0}
        >
          {view === "chart" ? "Ver como tabela" : "Ver gráfico"}
        </Button>
      </div>
    </div>
  );

  let body;
  if (error) {
    body = (
      <EmptyState
        size="compact"
        tone="danger"
        icon={<ChartColumn size={28} aria-hidden />}
        title="Não carregou o consumo"
        action={
          onRetry && (
            <Button variant="secondary" icon={<RotateCw size={16} aria-hidden />} onClick={onRetry}>
              Tentar de novo
            </Button>
          )
        }
      />
    );
  } else if (loading) {
    body = (
      <SkeletonGroup label="Carregando consumo">
        <Skeleton shape="block" height={300} />
      </SkeletonGroup>
    );
  } else if (days.length === 0) {
    body = (
      <EmptyState size="compact" icon={<ChartColumn size={28} aria-hidden />} title="Sem consumo no período">
        Mude o período ou os filtros, ou gere uma Rodada para ver o consumo.
      </EmptyState>
    );
  } else if (view === "table") {
    body = (
      <div className="chart__tablewrap" style={{ opacity: refetching ? 0.5 : undefined }} aria-busy={refetching || undefined}>
        <table className="chart__table">
          <caption className="chart__sr">{metric === "tokens" ? "Tokens por dia e Etapa" : "Custo por dia e Etapa"}</caption>
          <thead>
            <tr>
              <th scope="col">Dia</th>
              {stages.map((s) => (
                <th key={s.id} scope="col" className="chart__num">
                  {s.label}
                </th>
              ))}
              <th scope="col" className="chart__num">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {days.map((d, i) => (
              <tr key={d.id}>
                <th scope="row">{d.longLabel ?? d.label}</th>
                {stages.map((s) => (
                  <td key={s.id} className="chart__num">
                    {metric === "tokens" ? formatTokens(valueOf(d, s.id, metric)) : formatCost(valueOf(d, s.id, metric))}
                  </td>
                ))}
                <td className="chart__num chart__total">
                  {metric === "tokens" ? formatTokens(totals[i]) : formatCost(totals[i])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } else {
    const activeDay = active != null ? days[active] : undefined;
    const flip = active != null && active > days.length / 2;
    body = (
      <div className="chart__plot" style={{ opacity: refetching ? 0.5 : undefined }} aria-busy={refetching || undefined}>
        <div className="chart__yaxis" aria-hidden>
          {ticks.map((t) => (
            <span key={t}>{fmtAxis(metric, t)}</span>
          ))}
        </div>
        <div className="chart__area" onPointerLeave={() => setHover(null)}>
          <div className="chart__grid" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="chart__cols">
            {days.map((d, i) => {
              const summary = stages
                .filter((s) => valueOf(d, s.id, metric) > 0)
                .map((s) => `${s.label} ${fmtFull(metric, valueOf(d, s.id, metric))}`)
                .join(", ");
              const lastIdx = stages.reduce((acc, s, k) => (valueOf(d, s.id, metric) > 0 ? k : acc), -1);
              return (
                <button
                  key={d.id}
                  type="button"
                  className={["chart__col", active === i && "chart__col--active"].filter(Boolean).join(" ")}
                  aria-label={`${d.longLabel ?? d.label}: total ${fmtFull(metric, totals[i])}${summary ? `. ${summary}` : ""}`}
                  onPointerEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                >
                  <span className="chart__stack">
                    {stages.slice(0, SLOTS.length).map((s, k) => {
                      const v = valueOf(d, s.id, metric);
                      if (v <= 0) return null;
                      const first = stages.findIndex((x) => valueOf(d, x.id, metric) > 0) === k;
                      return (
                        <motion.span
                          key={s.id}
                          className={["chart__seg", first && "chart__seg--base", k === lastIdx && "chart__seg--top"].filter(Boolean).join(" ")}
                          style={{ background: `var(--color-chart-${SLOTS[k]})` }}
                          initial={{ height: 0 }}
                          animate={{ height: `${(v / top) * 100}%` }}
                          transition={transition.soft}
                        />
                      );
                    })}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="chart__xaxis" aria-hidden>
            {days.map((d, i) => (
              <span key={d.id}>{i % every === 0 ? d.label : ""}</span>
            ))}
          </div>
          {activeDay && active != null && (
            <div
              className={["chart__tip", flip && "chart__tip--left"].filter(Boolean).join(" ")}
              style={{ left: `${((active + 0.5) / days.length) * 100}%` }}
              aria-hidden
            >
              <div className="chart__tip-day">{activeDay.longLabel ?? activeDay.label}</div>
              <div className="chart__tip-total">{fmtFull(metric, totals[active])}</div>
              <ul className="chart__tip-list">
                {stages.map((s, k) => (
                  <li key={s.id}>
                    <span className="chart__key" style={{ background: `var(--color-chart-${SLOTS[k]})` }} />
                    <span className="chart__tip-name">{s.label}</span>
                    <span className="chart__tip-value">
                      {metric === "tokens" ? formatTokens(valueOf(activeDay, s.id, metric)) : formatCost(valueOf(activeDay, s.id, metric))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  const showLegend = !error && !loading && days.length > 0;

  return (
    <section className={["chart", className].filter(Boolean).join(" ")} aria-labelledby={`${uid}-t`}>
      {header}
      {body}
      {showLegend && view === "chart" && (
        <ul className="chart__legend" aria-label={`Etapas, em ${unitLabel}`}>
          {stages.map((s, k) => (
            <li key={s.id}>
              <span className="chart__swatch" style={{ background: `var(--color-chart-${SLOTS[k]})` }} aria-hidden />
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
