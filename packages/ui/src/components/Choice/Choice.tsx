import { useEffect, useRef, type ChangeEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, CircleAlert, Minus } from "lucide-react";
import { transition } from "../../motion";
import "../Field/Field.css";
import "./Choice.css";

/** Peças compartilhadas por Checkbox e RadioGroup: o item (marcador + rótulo) e a mensagem de ajuda/erro. */

export type ChoiceVariant = "plain" | "card";
export type ChoiceForcedState = "hover" | "pressed" | "focus";

export interface ChoiceItemProps {
  kind: "checkbox" | "radio";
  id: string;
  name?: string;
  value?: string;
  checked: boolean | "indeterminate";
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  label: ReactNode;
  description?: ReactNode;
  variant?: ChoiceVariant;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  describedBy?: string;
  /** Só para a matriz de estados do Storybook. */
  forceState?: ChoiceForcedState;
  className?: string;
}

export function ChoiceItem({
  kind,
  id,
  name,
  value,
  checked,
  onChange,
  label,
  description,
  variant = "plain",
  disabled,
  invalid,
  required,
  describedBy,
  forceState,
  className,
}: ChoiceItemProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = checked === "indeterminate";
  }, [checked]);

  const classes = [
    "choice",
    `choice--${kind}`,
    `choice--${variant}`,
    disabled && "choice--disabled",
    invalid && "choice--invalid",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const markKey = checked === "indeterminate" ? "mixed" : checked ? "on" : "off";

  return (
    <label className={classes} data-checked={checked === "indeterminate" ? "mixed" : checked} data-state={forceState}>
      <input
        ref={ref}
        id={id}
        className="choice__input"
        type={kind}
        name={name}
        value={value}
        checked={checked === true}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      />
      <span className="choice__mark" aria-hidden>
        <AnimatePresence initial={false}>
          {markKey !== "off" && (
            <motion.span
              key={markKey}
              className="choice__mark-content"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={transition.snappy}
            >
              {kind === "radio" ? (
                <span className="choice__dot" />
              ) : markKey === "mixed" ? (
                <Minus size={16} strokeWidth={3} />
              ) : (
                <Check size={16} strokeWidth={3} />
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="choice__body">
        <span className="choice__label">{label}</span>
        {description && <span className="choice__description">{description}</span>}
      </span>
    </label>
  );
}

/** Ajuda ou erro abaixo do item ou do grupo. Erro sempre com ícone, nunca só cor. */
export function ChoiceMessage({ id, help, error }: { id: string; help?: ReactNode; error?: ReactNode }) {
  const kind = error ? "error" : help ? "help" : null;
  return (
    <div className="choice-message" aria-live="polite">
      <AnimatePresence initial={false} mode="wait">
        {kind && (
          <motion.p
            key={kind}
            id={id}
            className={kind === "error" ? "field__error" : "field__help"}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0, transition: transition.soft }}
            exit={{ opacity: 0, transition: transition.fade }}
          >
            {kind === "error" && <CircleAlert size={16} aria-hidden />}
            <span>{kind === "error" ? error : help}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function messageId(id: string, { error, help }: { error?: ReactNode; help?: ReactNode }) {
  return error || help ? `${id}-message` : undefined;
}
