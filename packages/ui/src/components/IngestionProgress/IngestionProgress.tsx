import { Check, CircleAlert, Circle, Loader2 } from "lucide-react";
import { ProgressBar } from "../ProgressBar/ProgressBar";
import "./IngestionProgress.css";

export type IngestionStepStatus = "pending" | "active" | "done" | "error";

export interface IngestionStep {
  id: string;
  /** "Baixando", "Extraindo", "Classificando". */
  label: string;
  status: IngestionStepStatus;
  /** 0 a 100, só em `active`. Omitido: progresso desconhecido (barra indeterminada). */
  progress?: number;
  /** Só em `error`: o motivo, em uma frase. */
  error?: string;
}

export interface IngestionProgressProps {
  steps: IngestionStep[];
  /** Uma linha só, para dentro de `SourceRow`: "Extraindo, 2 de 3". */
  compact?: boolean;
  className?: string;
}

/** As três Etapas padrão do processamento de uma Fonte, todas pendentes. */
export const defaultIngestionSteps: IngestionStep[] = [
  { id: "download", label: "Baixando", status: "pending" },
  { id: "extract", label: "Extraindo", status: "pending" },
  { id: "classify", label: "Classificando", status: "pending" },
];

const ICON_SIZE = 18;

function StepIcon({ status }: { status: IngestionStepStatus }) {
  if (status === "done") return <Check size={ICON_SIZE} strokeWidth={2.5} aria-hidden />;
  if (status === "active") return <Loader2 className="ingest__spin" size={ICON_SIZE} strokeWidth={2.5} aria-hidden />;
  if (status === "error") return <CircleAlert size={ICON_SIZE} strokeWidth={2.5} aria-hidden />;
  return <Circle size={ICON_SIZE} aria-hidden />;
}

const STATUS_TEXT: Record<IngestionStepStatus, string> = {
  pending: "pendente",
  active: "em andamento",
  done: "feito",
  error: "falhou",
};

/** Etapas do processamento de uma Fonte (ticket 11). A ordem e os nomes são de quem usa: Fonte de texto colado não baixa, então omite "Baixando". */
export function IngestionProgress({ steps, compact, className }: IngestionProgressProps) {
  const classes = ["ingest", compact && "ingest--compact", className].filter(Boolean).join(" ");
  const active = steps.find((s) => s.status === "active");
  const failed = steps.find((s) => s.status === "error");

  if (compact) {
    const current = failed ?? active;
    const done = steps.filter((s) => s.status === "done").length;
    const position = current ? steps.indexOf(current) + 1 : done;
    const text = current ? `${current.label}, ${position} de ${steps.length}` : `${done} de ${steps.length} etapas`;
    return (
      <div className={classes} role="status">
        <span className={["ingest__line", failed && "ingest__line--error"].filter(Boolean).join(" ")}>
          {current && <StepIcon status={current.status} />}
          <span className="ingest__text">{text}</span>
        </span>
        {active && (
          <ProgressBar
            compact
            aria-label={`${active.label}`}
            {...(active.progress === undefined ? { indeterminate: true } : { value: active.progress, max: 100 })}
          />
        )}
      </div>
    );
  }

  return (
    <ol className={classes} aria-label="Etapas do processamento">
      {steps.map((step) => (
        <li key={step.id} className={`ingest__step ingest__step--${step.status}`} aria-current={step.status === "active" ? "step" : undefined}>
          <span className="ingest__icon">
            <StepIcon status={step.status} />
          </span>
          <span className="ingest__body">
            <span className="ingest__label">
              {step.label}
              <span className="ingest__sr"> ({STATUS_TEXT[step.status]})</span>
            </span>
            {step.status === "active" && (
              <ProgressBar
                compact
                aria-label={step.label}
                {...(step.progress === undefined ? { indeterminate: true } : { value: step.progress, max: 100 })}
              />
            )}
            {step.status === "error" && step.error && <span className="ingest__error">{step.error}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
