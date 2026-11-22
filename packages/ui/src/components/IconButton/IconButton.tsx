import type { ReactNode } from "react";
import { motion } from "motion/react";
import { tapScale, transition } from "../../motion";
import "./IconButton.css";

export interface IconButtonProps {
  /** Nome acessível, obrigatório: diga a ação e o alvo ("Renomear Redes"). Também vira o `title`. */
  label: string;
  /** Ícone Lucide de 18px. */
  icon: ReactNode;
  onClick?: () => void;
  /** `danger` para o que apaga. Só muda a cor no hover e no foco, nunca o único sinal. */
  tone?: "default" | "danger";
  disabled?: boolean;
  /** Mantém o botão pressionado (ex.: abre um menu). */
  pressed?: boolean;
  className?: string;
  /** Só para a matriz de estados do Storybook. */
  forceState?: "hover" | "pressed" | "focus";
}

/** Botão só de ícone, discreto, para ações em linhas e cartões. Ação principal da tela usa `Button`. */
export function IconButton({ label, icon, onClick, tone = "default", disabled, pressed, className, forceState }: IconButtonProps) {
  const classes = ["icon-btn", tone === "danger" && "icon-btn--danger", className].filter(Boolean).join(" ");
  return (
    <motion.button
      type="button"
      className={classes}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      data-state={forceState}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: tapScale }}
      transition={transition.snappy}
    >
      {icon}
    </motion.button>
  );
}
