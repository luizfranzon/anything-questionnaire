import { Loader2 } from "lucide-react";
import "./Spinner.css";

export type SpinnerSize = "sm" | "md" | "lg";

const px: Record<SpinnerSize, number> = { sm: 16, md: 24, lg: 40 };

export interface SpinnerProps {
  size?: SpinnerSize;
  /** Use sobre o painel escuro. */
  onDark?: boolean;
  /** Texto lido por leitores de tela. */
  label?: string;
  className?: string;
}

/** Indicador de carregamento sem progresso conhecido. Com movimento reduzido, pulsa em vez de girar. */
export function Spinner({ size = "md", onDark = false, label = "Carregando", className }: SpinnerProps) {
  const classes = ["spinner", `spinner--${size}`, onDark && "spinner--on-dark", className].filter(Boolean).join(" ");
  return (
    <span className={classes} role="status" aria-label={label}>
      <Loader2 size={px[size]} strokeWidth={size === "lg" ? 2 : 2.25} aria-hidden />
    </span>
  );
}
