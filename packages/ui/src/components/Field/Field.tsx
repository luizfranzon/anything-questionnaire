import { useState, type FocusEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, Loader2 } from "lucide-react";
import { transition } from "../../motion";
import "./Field.css";

/**
 * Peças compartilhadas por TextInput, Textarea e NumberInput:
 * `FieldShell` (rótulo, ajuda, erro, contador) e `Control` (a caixa com borda).
 */

// O anel de foco só aparece quando o foco veio do teclado. Em campo de texto o
// :focus-visible casa também no clique, então guardamos a última modalidade.
let keyboardModality = false;
if (typeof window !== "undefined") {
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Tab") keyboardModality = true;
    },
    true,
  );
  window.addEventListener("pointerdown", () => (keyboardModality = false), true);
}

export type ControlForcedState = "hover" | "focus";

export interface ControlProps {
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  loading?: boolean;
  /** `start` alinha ao topo (Textarea). */
  align?: "center" | "start";
  /** Só para a matriz de estados do Storybook. */
  forceState?: ControlForcedState;
  className?: string;
  children: ReactNode;
}

export function Control({
  invalid,
  disabled,
  readOnly,
  loading,
  align = "center",
  forceState,
  className,
  children,
}: ControlProps) {
  const [focus, setFocus] = useState<"none" | "pointer" | "keyboard">("none");
  const classes = [
    "control",
    align === "start" && "control--start",
    invalid && "control--invalid",
    disabled && "control--disabled",
    readOnly && "control--readonly",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={classes}
      data-state={forceState}
      data-focus={focus === "none" ? undefined : focus}
      onFocus={() => setFocus(keyboardModality ? "keyboard" : "pointer")}
      onBlur={(e: FocusEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus("none");
      }}
    >
      {children}
      <AnimatePresence>
        {loading && (
          <motion.span
            className="control__spinner"
            role="status"
            aria-label="Carregando"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={transition.snappy}
          >
            <Loader2 size={20} aria-hidden />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export function describedBy(id: string, { error, help }: { error?: ReactNode; help?: ReactNode }) {
  return error ? `${id}-error` : help ? `${id}-help` : undefined;
}

export interface FieldShellProps {
  id: string;
  label: string;
  /** Mostra "(opcional)" ao lado do rótulo. Por padrão todo campo é obrigatório. */
  optional?: boolean;
  help?: ReactNode;
  /** Quando existe, substitui a ajuda. Sempre com ícone, nunca só cor. */
  error?: ReactNode;
  disabled?: boolean;
  /** Canto direito do rodapé (ex.: "120/2000"). */
  counter?: ReactNode;
  children: ReactNode;
}

export function FieldShell({ id, label, optional, help, error, disabled, counter, children }: FieldShellProps) {
  const kind = error ? "error" : help ? "help" : null;
  return (
    <div className={["field", disabled && "field--disabled"].filter(Boolean).join(" ")}>
      <label className="field__label" htmlFor={id}>
        {label}
        {optional && <span className="field__optional"> (opcional)</span>}
      </label>
      {children}
      <div className="field__footer">
        {/* A região fica sempre no DOM para o leitor de tela anunciar o erro quando entra. */}
        <div className="field__message" aria-live="polite">
          <AnimatePresence initial={false} mode="wait">
            {kind && (
              <motion.p
                key={kind}
                id={`${id}-${kind}`}
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
        {counter != null && <span className="field__counter">{counter}</span>}
      </div>
    </div>
  );
}
