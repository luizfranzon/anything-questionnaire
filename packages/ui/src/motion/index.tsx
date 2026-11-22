import type { ReactNode } from "react";
import { MotionConfig, type Transition } from "motion/react";

/**
 * Movimento do design system. Micro animações, sempre curtas e sem exagero (clima: calmo).
 * Duração e easing espelham --duration-* e --ease de tokens.css.
 */
export const transition = {
  /** Resposta imediata ao toque: botões, alternativas. */
  snappy: { type: "spring", stiffness: 520, damping: 34, mass: 0.7 } satisfies Transition,
  /** Entrada e saída de elementos: painéis, avisos. */
  soft: { type: "spring", stiffness: 260, damping: 28, mass: 0.9 } satisfies Transition,
  /** Troca de opacidade e cor. */
  fade: { duration: 0.15, ease: [0.2, 0, 0, 1] } satisfies Transition,
};

/** Escala ao pressionar. */
export const tapScale = 0.97;

/** Respeita prefers-reduced-motion: some o movimento, mantém opacidade. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
