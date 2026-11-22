import { ChevronRight, CircleSlash } from "lucide-react";
import { Badge } from "../Badge/Badge";
import { ProgressBar } from "../ProgressBar/ProgressBar";
import { Skeleton } from "../Skeleton/Skeleton";
import "./RoundHistoryRow.css";

export interface RoundHistoryRowProps {
  /** "22/11". */
  date: string;
  mode: "study" | "mock";
  /** Acertos entre as Perguntas respondidas. */
  correct: number;
  /** Perguntas respondidas. */
  answered: number;
  /** Perguntas da Rodada. Só importa quando `ended`. */
  total?: number;
  /** Rodada encerrada antes do fim: mostra só o que foi respondido. */
  ended?: boolean;
  href?: string;
  onOpen?: () => void;
  status?: "ready" | "loading";
  className?: string;
  /** Só para a matriz de estados do Storybook. */
  forceState?: "hover" | "focus";
}

const MODE_LABEL = { study: "Modo estudo", mock: "Simulado" } as const;

/** Linha do histórico de Rodadas. Use dentro de um `ul`; a ordem (da mais recente) é de quem lista. */
export function RoundHistoryRow({
  date,
  mode,
  correct,
  answered,
  total,
  ended,
  href,
  onOpen,
  status = "ready",
  className,
  forceState,
}: RoundHistoryRowProps) {
  const classes = ["rhrow", className].filter(Boolean).join(" ");

  if (status === "loading") {
    return (
      <li className={classes} aria-hidden>
        <div className="rhrow__box">
          <Skeleton width={56} />
          <Skeleton width={96} />
          <Skeleton shape="block" width="100%" height={6} />
          <Skeleton width={64} />
          <span />
        </div>
      </li>
    );
  }

  const empty = answered === 0;
  const resultText = empty ? "Nenhuma respondida" : `${correct}/${answered}`;
  const content = (
    <>
      <span className="rhrow__date">{date}</span>
      <span className="rhrow__mode">{MODE_LABEL[mode]}</span>
      {empty ? <span /> : <ProgressBar compact value={correct} max={answered} aria-label={`${correct} de ${answered} certas`} />}
      <span className="rhrow__result">{resultText}</span>
      <ChevronRight className="rhrow__chevron" size={20} aria-hidden />
      {ended && (
        <span className="rhrow__note">
          <Badge icon={<CircleSlash size={14} strokeWidth={2.5} />}>Encerrada</Badge>
          {total != null && (
            <span>
              {answered} de {total} respondidas
            </span>
          )}
        </span>
      )}
    </>
  );

  return (
    <li className={classes}>
      {href ? (
        <a className="rhrow__box" href={href} data-state={forceState}>
          {content}
        </a>
      ) : (
        <button type="button" className="rhrow__box" onClick={onOpen} data-state={forceState}>
          {content}
        </button>
      )}
    </li>
  );
}
