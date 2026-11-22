import type { ReactNode } from "react";
import {
  Archive,
  Ban,
  Check,
  CircleAlert,
  Clock,
  Equal,
  Flag,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import "./Badge.css";

export type BadgeTone = "neutral" | "info" | "success" | "danger" | "warn";

export interface BadgeProps {
  /** `neutral` é o padrão; `info` tem contorno forest; `success`, `danger` e `warn` seguem a paleta de status. */
  tone?: BadgeTone;
  /** Ícone Lucide de 14px. Cor nunca é o único sinal: todo tom de status leva ícone. */
  icon?: ReactNode;
  /** Troca o ícone por um spinner pequeno (algo em andamento). O tamanho do selo não muda. */
  loading?: boolean;
  className?: string;
  children: ReactNode;
}

/** Selo informativo, não interativo. Para situações de domínio, use `StatusTag`. */
export function Badge({ tone = "neutral", icon, loading, className, children }: BadgeProps) {
  return (
    <span className={["badge", `badge--${tone}`, className].filter(Boolean).join(" ")}>
      {loading ? (
        <Loader2 className="badge__spinner" size={14} strokeWidth={2.5} aria-hidden />
      ) : icon ? (
        <span className="badge__icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="badge__text">{children}</span>
    </span>
  );
}

/** Situações de Fonte, Pergunta e Contestação. "Anulada" vale para Pergunta e Contestação. */
export type Status =
  | "processing"
  | "ready"
  | "failed"
  | "active"
  | "contested"
  | "voided"
  | "archived"
  | "reviewing"
  | "kept"
  | "corrected";

interface StatusSpec {
  label: string;
  tone: BadgeTone;
  icon?: LucideIcon;
  loading?: boolean;
}

export const statusSpecs: Record<Status, StatusSpec> = {
  // Fonte
  processing: { label: "Processando", tone: "info", loading: true },
  ready: { label: "Pronta", tone: "success", icon: Check },
  failed: { label: "Falhou", tone: "danger", icon: CircleAlert },
  // Pergunta
  active: { label: "Ativa", tone: "success", icon: Check },
  contested: { label: "Contestada", tone: "warn", icon: Flag },
  voided: { label: "Anulada", tone: "neutral", icon: Ban },
  archived: { label: "Arquivada", tone: "neutral", icon: Archive },
  // Contestação
  reviewing: { label: "Em análise", tone: "info", icon: Clock },
  kept: { label: "Mantida", tone: "neutral", icon: Equal },
  corrected: { label: "Corrigida", tone: "success", icon: Check },
};

export interface StatusTagProps {
  status: Status;
  /** Troca o rótulo padrão (ex.: "Falhou ao baixar"). Tom e ícone continuam os da situação. */
  children?: ReactNode;
  className?: string;
}

/** Selo de situação: o texto, o tom e o ícone vêm da situação, para a mesma coisa ter sempre a mesma cara. */
export function StatusTag({ status, children, className }: StatusTagProps) {
  const spec = statusSpecs[status];
  const Icon = spec.icon;
  return (
    <Badge
      tone={spec.tone}
      loading={spec.loading}
      icon={Icon ? <Icon size={14} strokeWidth={2.5} /> : undefined}
      className={className}
    >
      {children ?? spec.label}
    </Badge>
  );
}
