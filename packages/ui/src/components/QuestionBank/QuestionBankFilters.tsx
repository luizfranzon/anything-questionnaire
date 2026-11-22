import { Button } from "../Button/Button";
import { Select, type SelectOption } from "../Select/Select";
import "./QuestionBank.css";

export type BankResultFilter = "all" | "wrong" | "guess" | "right" | "never";
export type BankStatusFilter = "all" | "active" | "voided" | "contested" | "archived";

export interface QuestionBankFilterValue {
  /** `"all"` ou o id do Tópico. */
  topic: string;
  result: BankResultFilter;
  status: BankStatusFilter;
}

export const emptyBankFilters: QuestionBankFilterValue = { topic: "all", result: "all", status: "all" };

export interface QuestionBankFiltersProps {
  /** Tópicos do Estudo. O "Todos os Tópicos" é acrescentado aqui. */
  topics: { value: string; label: string }[];
  value: QuestionBankFilterValue;
  onChange: (value: QuestionBankFilterValue) => void;
  /** Perguntas do Estudo, sem filtro. */
  total?: number;
  /** Perguntas que passam nos filtros. */
  shown?: number;
  /** Carregando as Perguntas ou os Tópicos: os campos mantêm o tamanho e não abrem. */
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const RESULT_OPTIONS: SelectOption[] = [
  { value: "all", label: "Todos os resultados" },
  { value: "wrong", label: "Errei", description: "Errada ou Não sei na última Resposta" },
  { value: "guess", label: "Chutei", description: "Acertei com dúvida" },
  { value: "right", label: "Acertei", description: "Acertei com certeza" },
  { value: "never", label: "Nunca respondida" },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: "all", label: "Todas as situações" },
  { value: "active", label: "Ativa" },
  { value: "voided", label: "Anulada" },
  { value: "contested", label: "Contestada" },
  { value: "archived", label: "Arquivada" },
];

/** Filtros do banco de Perguntas (ticket 10). Combináveis; quem usa filtra e pagina. */
export function QuestionBankFilters({ topics, value, onChange, total, shown, loading, disabled, className }: QuestionBankFiltersProps) {
  const active = (value.topic !== "all" ? 1 : 0) + (value.result !== "all" ? 1 : 0) + (value.status !== "all" ? 1 : 0);
  const topicOptions: SelectOption[] = [{ value: "all", label: "Todos os Tópicos" }, ...topics];

  const count =
    loading || total === undefined || shown === undefined
      ? ""
      : active > 0
        ? `${shown} de ${total} ${total === 1 ? "Pergunta" : "Perguntas"}`
        : `${total} ${total === 1 ? "Pergunta" : "Perguntas"}`;

  return (
    <div className={["qbf", className].filter(Boolean).join(" ")} role="search" aria-label="Filtrar Perguntas">
      <div className="qbf__fields">
        <Select
          label="Tópico"
          options={topicOptions}
          value={value.topic}
          onValueChange={(topic) => onChange({ ...value, topic })}
          loading={loading}
          disabled={disabled}
        />
        <Select
          label="Resultado"
          options={RESULT_OPTIONS}
          value={value.result}
          onValueChange={(result) => onChange({ ...value, result: result as BankResultFilter })}
          loading={loading}
          disabled={disabled}
        />
        <Select
          label="Situação"
          options={STATUS_OPTIONS}
          value={value.status}
          onValueChange={(status) => onChange({ ...value, status: status as BankStatusFilter })}
          loading={loading}
          disabled={disabled}
        />
      </div>
      <div className="qbf__bar">
        {/* Reserva a altura da linha mesmo sem texto, para a lista não pular */}
        <span className="qbf__count" role="status" aria-live="polite">
          {count}
        </span>
        {active > 0 && (
          <Button variant="link" onClick={() => onChange(emptyBankFilters)} disabled={disabled}>
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
