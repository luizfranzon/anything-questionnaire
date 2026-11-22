import { motion } from "motion/react";
import { transition } from "../../motion";
import "./RoundProgress.css";

/** Até aqui, um ponto por Pergunta. Acima, barra contínua. */
export const ROUND_PROGRESS_MAX_DOTS = 30;

export interface RoundProgressProps {
  /** Pergunta atual, de 1 a `total`. */
  current: number;
  /** Quantidade de Perguntas da Rodada. */
  total: number;
  /** A Pergunta atual já foi respondida (painel de correção aberto). Preenche o ponto atual. */
  currentAnswered?: boolean;
  className?: string;
}

/**
 * Posição dentro de uma Rodada pronta. Só indicador: sem hover, clique nem foco.
 * Não mostra o resultado de cada Pergunta (acerto/erro), só o que já foi respondido.
 */
export function RoundProgress({ current, total, currentAnswered = false, className }: RoundProgressProps) {
  const safeTotal = Math.max(1, Math.floor(total));
  const pos = Math.min(safeTotal, Math.max(1, Math.floor(current)));
  const answered = pos - 1 + (currentAnswered ? 1 : 0);
  const asBar = safeTotal > ROUND_PROGRESS_MAX_DOTS;
  const classes = ["rprogress", asBar && "rprogress--bar", className].filter(Boolean).join(" ");

  return (
    <div
      className={classes}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={safeTotal}
      aria-valuenow={pos}
      aria-valuetext={`Pergunta ${pos} de ${safeTotal}`}
    >
      {asBar ? (
        <span className="rprogress__track" aria-hidden>
          <motion.span
            className="rprogress__fill"
            initial={false}
            animate={{ width: `${(answered / safeTotal) * 100}%` }}
            transition={transition.soft}
          />
        </span>
      ) : (
        <span className="rprogress__dots" aria-hidden>
          {Array.from({ length: safeTotal }, (_, i) => {
            const done = i < answered;
            const isCurrent = i === pos - 1;
            return (
              <motion.span
                key={i}
                className="rprogress__dot"
                data-done={done || undefined}
                data-current={isCurrent || undefined}
                initial={false}
                animate={{ scale: isCurrent ? 1.25 : 1 }}
                transition={transition.soft}
              />
            );
          })}
        </span>
      )}
      <span className="rprogress__count" aria-hidden>
        {pos}/{safeTotal}
      </span>
    </div>
  );
}
