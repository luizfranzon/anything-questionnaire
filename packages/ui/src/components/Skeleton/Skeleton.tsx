import type { CSSProperties, ReactNode } from "react";
import "./Skeleton.css";

export type SkeletonShape = "text" | "block" | "circle";

export interface SkeletonProps {
  /** `text`: linha com a altura do corpo; `block`: retângulo; `circle`: avatar ou ícone. */
  shape?: SkeletonShape;
  width?: number | string;
  height?: number | string;
  /** Só para `text`: quantas linhas. A última fica mais curta. */
  lines?: number;
  className?: string;
}

/** Marca o lugar do conteúdo com o tamanho exato dele, para a página não pular quando carregar. */
export function Skeleton({ shape = "text", width, height, lines = 1, className }: SkeletonProps) {
  if (shape === "text" && lines > 1) {
    return (
      <span className={["skeleton-lines", className].filter(Boolean).join(" ")} aria-hidden>
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            className="skeleton skeleton--text"
            style={{ width: i === lines - 1 ? "60%" : width, height }}
          />
        ))}
      </span>
    );
  }
  const style: CSSProperties = { width, height };
  return <span className={["skeleton", `skeleton--${shape}`, className].filter(Boolean).join(" ")} style={style} aria-hidden />;
}

export interface SkeletonGroupProps {
  /** Texto lido por leitores de tela. */
  label?: string;
  children: ReactNode;
}

/** Envolve um conjunto de Skeletons e o anuncia uma vez só. */
export function SkeletonGroup({ label = "Carregando", children }: SkeletonGroupProps) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className="skeleton-group">
      {children}
    </div>
  );
}
