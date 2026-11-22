import { motion } from "motion/react";
import { Check, CircleAlert } from "lucide-react";
import { transition } from "../../motion";
import "./ProgressBar.css";

export type ProgressStatus = "default" | "success" | "error";

export interface ProgressBarProps {
  /** Valor atual. Omitido ou `indeterminate`: progresso desconhecido. */
  value?: number;
  max?: number;
  indeterminate?: boolean;
  /** Rótulo visível acima da barra, ex.: "Gerando Rodada". Sem ele, passe `aria-label`. */
  label?: string;
  /** Texto do valor à direita, ex.: "12 de 30". Padrão: porcentagem. Use `false` para ocultar. */
  valueText?: string | false;
  status?: ProgressStatus;
  /** Barra fina e sem texto, para linhas de lista (ex.: Desempenho por Tópico). */
  compact?: boolean;
  /** Use sobre o painel escuro. */
  onDark?: boolean;
  "aria-label"?: string;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  indeterminate = false,
  label,
  valueText,
  status = "default",
  compact = false,
  onDark = false,
  className,
  "aria-label": ariaLabel,
}: ProgressBarProps) {
  const unknown = indeterminate || value === undefined;
  const pct = unknown ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  const text = valueText === false || compact || unknown ? undefined : (valueText ?? `${Math.round(pct)}%`);
  const classes = [
    "progress",
    `progress--${status}`,
    compact && "progress--compact",
    onDark && "progress--on-dark",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {!compact && (label || text || status !== "default") && (
        <div className="progress__head">
          <span className="progress__label">{label}</span>
          <span className="progress__value">
            {status === "success" && <Check size={16} strokeWidth={2.5} aria-hidden />}
            {status === "error" && <CircleAlert size={16} strokeWidth={2.25} aria-hidden />}
            {text}
          </span>
        </div>
      )}
      <div
        className="progress__track"
        role="progressbar"
        aria-label={ariaLabel ?? label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={unknown ? undefined : value}
        aria-valuetext={text}
        aria-invalid={status === "error" || undefined}
      >
        {unknown ? (
          <span className="progress__fill progress__fill--indeterminate" />
        ) : (
          <motion.span
            className="progress__fill"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={transition.soft}
          />
        )}
      </div>
    </div>
  );
}
