import type { ReactNode } from "react";
import { motion } from "motion/react";
import { transition } from "../../motion";
import "./EmptyState.css";

export interface EmptyStateProps {
  /** Ícone Lucide de 28px. Nunca emoji nem ilustração. */
  icon: ReactNode;
  /** O que está vazio, em poucas palavras: "Nenhum Estudo ainda". */
  title: string;
  /** Uma frase com o próximo passo. */
  children?: ReactNode;
  /** Até duas ações, a principal primeiro. */
  action?: ReactNode;
  /** `page` ocupa a área toda; `compact` cabe dentro de um cartão ou lista. */
  size?: "page" | "compact";
  /** `danger` para "não carregou": ícone berry, texto igual. */
  tone?: "neutral" | "danger";
  /** Contorno tracejado. Use quando o vazio é um lugar a preencher (Fontes de um Estudo). */
  outlined?: boolean;
  className?: string;
}

/** Lista, página ou resultado sem nada para mostrar. Sempre diz o que fazer em seguida. */
export function EmptyState({
  icon,
  title,
  children,
  action,
  size = "page",
  tone = "neutral",
  outlined = false,
  className,
}: EmptyStateProps) {
  const classes = [
    "empty",
    `empty--${size}`,
    tone === "danger" && "empty--danger",
    outlined && "empty--outlined",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <motion.div
      className={classes}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition.soft}
    >
      <span className="empty__icon" aria-hidden>
        {icon}
      </span>
      <h3 className="empty__title">{title}</h3>
      {children && <p className="empty__text">{children}</p>}
      {action && <div className="empty__actions">{action}</div>}
    </motion.div>
  );
}
