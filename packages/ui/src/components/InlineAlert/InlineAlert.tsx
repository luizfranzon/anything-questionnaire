import type { ReactNode } from "react";
import { motion } from "motion/react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { transition } from "../../motion";
import { CloseButton } from "../CloseButton/CloseButton";
import "./InlineAlert.css";

export type AlertTone = "info" | "success" | "warn" | "danger";

/** Cor nunca é o único sinal: cada tom tem o seu ícone. */
export const alertIcons: Record<AlertTone, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warn: TriangleAlert,
  danger: CircleAlert,
};

export interface InlineAlertProps {
  tone?: AlertTone;
  /** Frase curta em negrito. Opcional: avisos de uma linha só usam `children`. */
  title?: string;
  children?: ReactNode;
  /** Ação ao lado do texto, normalmente um `Button` `variant="link"`. */
  action?: ReactNode;
  /** Mostra o X. Quem usa remove o aviso. */
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}

/** Aviso dentro da página, junto do que ele explica. Erro usa `role="alert"`; os outros, `status`. */
export function InlineAlert({
  tone = "info",
  title,
  children,
  action,
  onDismiss,
  dismissLabel = "Fechar aviso",
  className,
}: InlineAlertProps) {
  const Icon = alertIcons[tone];
  return (
    <motion.div
      className={["alert", `alert--${tone}`, className].filter(Boolean).join(" ")}
      role={tone === "danger" ? "alert" : "status"}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition.soft}
    >
      <Icon className="alert__icon" size={20} strokeWidth={2.25} aria-hidden />
      <div className="alert__body">
        {title && <p className="alert__title">{title}</p>}
        {children && <div className="alert__text">{children}</div>}
        {action && <div className="alert__action">{action}</div>}
      </div>
      {onDismiss && <CloseButton label={dismissLabel} onClick={onDismiss} className="alert__close" />}
    </motion.div>
  );
}
