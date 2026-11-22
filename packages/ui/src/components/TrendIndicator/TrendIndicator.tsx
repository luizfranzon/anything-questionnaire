import { CircleDashed, Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import "./TrendIndicator.css";

export type Trend = "up" | "flat" | "down" | "unknown";

export interface TrendIndicatorProps {
  trend: Trend;
  /** Variação do Desempenho em pontos percentuais nas últimas Rodadas. Mostrada só quando há tendência. */
  delta?: number;
  /** Só o ícone, com o texto para leitor de tela (cabe em linhas apertadas). */
  iconOnly?: boolean;
  className?: string;
}

const specs: Record<Trend, { label: string; icon: LucideIcon }> = {
  up: { label: "Subindo", icon: TrendingUp },
  flat: { label: "Estável", icon: Minus },
  down: { label: "Caindo", icon: TrendingDown },
  unknown: { label: "Sem histórico", icon: CircleDashed },
};

/** Sinal de tendência do Desempenho. Sempre ícone e texto: cor nunca é o único sinal. */
export function TrendIndicator({ trend, delta, iconOnly, className }: TrendIndicatorProps) {
  const { label, icon: Icon } = specs[trend];
  const showDelta = delta != null && (trend === "up" || trend === "down");
  const deltaText = showDelta ? `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${Math.abs(delta)} pts` : null;
  return (
    <span className={["trend", `trend--${trend}`, className].filter(Boolean).join(" ")}>
      <Icon size={16} strokeWidth={2.25} aria-hidden />
      <span className={iconOnly ? "trend__text trend__text--hidden" : "trend__text"}>
        {label}
        {deltaText && <span className="trend__delta"> {deltaText}</span>}
      </span>
    </span>
  );
}
