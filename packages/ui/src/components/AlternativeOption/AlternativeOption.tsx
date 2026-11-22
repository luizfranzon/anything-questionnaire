import type { ReactNode } from "react";
import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import { Check, X } from "lucide-react";
import { tapScale, transition } from "../../motion";
import "./AlternativeOption.css";

export type AlternativeResult = "correct" | "wrong";

export interface AlternativeOptionProps extends Omit<HTMLMotionProps<"button">, "children"> {
  /** Atalho de teclado e marcador: "1" a "4". */
  shortcut: string;
  /** Marcada pelo usuário, ainda sem enviar. */
  selected?: boolean;
  /**
   * Depois da correção: `correct` é o Gabarito (marcado ou não), `wrong` é a Alternativa
   * que o usuário marcou e errou. Acerto e erro sempre com ícone, nunca só cor.
   */
  result?: AlternativeResult;
  /**
   * Não aceita clique e não reage ao hover: Alternativa já respondida ou do modo simulado
   * (mostra só o que o usuário marcou, sem revelar o Gabarito).
   */
  readOnly?: boolean;
  /** Texto da Alternativa. */
  children: ReactNode;
  /** Só para a matriz de estados do Storybook. */
  forceState?: "hover" | "pressed" | "focus";
}

export function AlternativeOption({
  shortcut,
  selected = false,
  result,
  readOnly = false,
  forceState,
  className,
  children,
  disabled,
  onClick,
  type = "button",
  ...rest
}: AlternativeOptionProps) {
  const locked = readOnly || result !== undefined;
  const inert = disabled || locked;
  const classes = [
    "alt",
    selected && !result && "alt--selected",
    result && `alt--${result}`,
    locked && "alt--locked",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.button
      {...rest}
      type={type}
      role="radio"
      aria-checked={selected || result === "wrong"}
      aria-disabled={locked || undefined}
      className={classes}
      disabled={disabled}
      data-state={forceState}
      onClick={locked ? undefined : onClick}
      whileTap={inert ? undefined : { scale: tapScale }}
      transition={transition.snappy}
    >
      <span className="alt__marker" aria-hidden>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={result ?? "key"}
            className="alt__marker-content"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={transition.snappy}
          >
            {result === "correct" ? (
              <Check size={18} strokeWidth={2.5} />
            ) : result === "wrong" ? (
              <X size={18} strokeWidth={2.5} />
            ) : (
              shortcut
            )}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="alt__text">{children}</span>
      {result && <span className="alt__sr">{result === "correct" ? "Resposta certa" : "Resposta errada"}</span>}
    </motion.button>
  );
}
