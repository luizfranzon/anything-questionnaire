import { motion } from "motion/react";
import { X } from "lucide-react";
import { tapScale, transition } from "../../motion";
import "./CloseButton.css";

export interface CloseButtonProps {
  /** Nome acessível. Diga o que fecha: "Fechar aviso", "Remover relatorio.pdf". */
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Use sobre o painel escuro. */
  onDark?: boolean;
  className?: string;
  /** Só para a matriz de estados do Storybook. */
  forceState?: "hover" | "pressed" | "focus";
}

/** X de fechar, compartilhado por Dialog, Toast, InlineAlert e a lista do FileDropzone. */
export function CloseButton({
  label = "Fechar",
  onClick,
  disabled,
  onDark,
  className,
  forceState,
}: CloseButtonProps) {
  const classes = ["close-btn", onDark && "close-btn--on-dark", className].filter(Boolean).join(" ");
  return (
    <motion.button
      type="button"
      className={classes}
      aria-label={label}
      disabled={disabled}
      data-state={forceState}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: tapScale }}
      transition={transition.snappy}
    >
      <X size={20} aria-hidden />
    </motion.button>
  );
}
