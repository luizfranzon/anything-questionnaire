import { Button } from "../Button/Button";
import { DateRangePicker, metricsPresets } from "../DateRange/DateRangePicker";
import type { ISODate } from "../DateRange/dates";
import { Select } from "../Select/Select";
import "./Metrics.css";

export type MetricsPeriod = "today" | "7d" | "30d" | "90d" | "custom";

export interface MetricsFilterValue {
  period: MetricsPeriod;
  /** Período efetivo, `aaaa-mm-dd`. Em atalho, o `FilterBar` preenche com as datas do atalho ao escolher. */
  from: string;
  to: string;
  /** `"all"` ou o id do Estudo. */
  study: string;
  /** `"all"` ou o id da Etapa. */
  stage: string;
}

export const defaultMetricsFilters: MetricsFilterValue = { period: "30d", from: "", to: "", study: "all", stage: "all" };

export interface FilterBarProps {
  value: MetricsFilterValue;
  onChange: (value: MetricsFilterValue) => void;
  studies: { value: string; label: string }[];
  stages: { value: string; label: string }[];
  /** Hoje. Padrão: o dia do sistema. O calendário não deixa escolher depois dele. */
  today?: ISODate;
  /** Carregando as listas: os campos mantêm o tamanho e não abrem. */
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Período, Estudo e Etapa das Métricas (ticket 20). Uma linha acima de tudo o que ela filtra. */
export function FilterBar({ value, onChange, studies, stages, today, loading, disabled, className }: FilterBarProps) {
  const changed = value.period !== defaultMetricsFilters.period || value.study !== "all" || value.stage !== "all";

  return (
    <div className={["mfilter", className].filter(Boolean).join(" ")} role="search" aria-label="Filtrar consumo">
      <div className="mfilter__fields">
        <DateRangePicker
          label="Período"
          presets={metricsPresets}
          today={today}
          value={{ preset: value.period, from: value.from, to: value.to }}
          onChange={({ preset, from, to }) => onChange({ ...value, period: preset as MetricsPeriod, from, to })}
          loading={loading}
          disabled={disabled}
        />
        <Select
          label="Estudo"
          options={[{ value: "all", label: "Todos os Estudos" }, ...studies]}
          value={value.study}
          onValueChange={(study) => onChange({ ...value, study })}
          loading={loading}
          disabled={disabled}
        />
        <Select
          label="Etapa"
          options={[{ value: "all", label: "Todas as Etapas" }, ...stages]}
          value={value.stage}
          onValueChange={(stage) => onChange({ ...value, stage })}
          loading={loading}
          disabled={disabled}
        />
      </div>
      <div className="mfilter__bar">
        {changed && (
          <Button variant="link" onClick={() => onChange(defaultMetricsFilters)} disabled={disabled}>
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
