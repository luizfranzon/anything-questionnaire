import { useId, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Check } from "lucide-react";
import { Button } from "../Button/Button";
import { tapScale, transition } from "../../motion";
import "./ConfidencePicker.css";

/** Valores do domínio. Na interface: "Tinha certeza" e "Chutei". */
export type Confidence = "certeza" | "duvida";

const OPTIONS: { value: Confidence; label: string; mark: ReactNode }[] = [
  { value: "certeza", label: "Tinha certeza", mark: <Check size={16} strokeWidth={2.5} /> },
  { value: "duvida", label: "Chutei", mark: "?" },
];

export interface ConfidencePickerProps {
  value?: Confidence;
  onChange?: (value: Confidence) => void;
  /** Painel forest de correção (modo estudo). Sem isso, fundo claro (simulado). */
  onDark?: boolean;
  /** Mostra só o que foi marcado, sem reagir (histórico, depois de avançar). */
  readOnly?: boolean;
  /** Ex.: "Não sei" marcado no simulado. O motivo fica visível sob o picker. */
  disabledReason?: string;
  /** Falha ao gravar a Resposta: mostra o erro inline com a ação de tentar de novo. */
  error?: boolean;
  onRetry?: () => void;
  /** Pergunta acima das opções. */
  legend?: string;
  className?: string;
  /** Só para a matriz de estados do Storybook. */
  forceState?: { option: Confidence; state: "hover" | "pressed" | "focus" };
}

export function ConfidencePicker({
  value,
  onChange,
  onDark = false,
  readOnly = false,
  disabledReason,
  error = false,
  onRetry,
  legend = "Como você respondeu?",
  className,
  forceState,
}: ConfidencePickerProps) {
  const name = useId();
  const reasonId = useId();
  const disabled = disabledReason !== undefined;
  const locked = readOnly || disabled;
  const classes = [
    "conf",
    onDark && "conf--on-dark",
    readOnly && "conf--readonly",
    disabled && "conf--disabled",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <fieldset className={classes} disabled={locked} aria-describedby={disabled ? reasonId : undefined}>
      <legend className="conf__legend">{legend}</legend>
      <div className="conf__options">
        {OPTIONS.map(({ value: v, label, mark }) => (
          <motion.label
            key={v}
            className="conf__option"
            data-selected={value === v || undefined}
            data-state={forceState?.option === v ? forceState.state : undefined}
            whileTap={locked ? undefined : { scale: tapScale }}
            transition={transition.snappy}
          >
            <input
              className="conf__input"
              type="radio"
              name={name}
              value={v}
              checked={value === v}
              disabled={locked}
              onChange={() => onChange?.(v)}
            />
            <span className="conf__icon" aria-hidden>
              {mark}
            </span>
            <span className="conf__label">{label}</span>
          </motion.label>
        ))}
      </div>

      {disabled && (
        <p id={reasonId} className="conf__note">
          {disabledReason}
        </p>
      )}

      <AnimatePresence initial={false}>
        {error && (
          <motion.div
            key="error"
            className="conf__error"
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={transition.soft}
          >
            <AlertCircle size={18} aria-hidden />
            <span className="conf__error-text">Não foi possível gravar.</span>
            <Button variant="link" onClick={onRetry}>
              Tentar de novo
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </fieldset>
  );
}
