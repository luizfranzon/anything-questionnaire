import { useId } from "react";
import { motion } from "motion/react";
import { ListChecks, Plus, RotateCcw, TriangleAlert } from "lucide-react";
import { transition } from "../../motion";
import { Button } from "../Button/Button";
import { ProgressBar } from "../ProgressBar/ProgressBar";
import { Skeleton, SkeletonGroup } from "../Skeleton/Skeleton";
import "./RoundResult.css";

export interface TopicScore {
  name: string;
  correct: number;
  total: number;
}

export interface RoundResultProps {
  /** Acertos e total de Perguntas respondidas. */
  correct: number;
  total: number;
  /** Quantas das erradas foram "Não sei". Aparece só quando maior que zero. */
  dontKnow?: number;
  mode: "study" | "mock";
  /** "22/11". */
  date?: string;
  /** Acertos por Tópico, na ordem em que devem aparecer. */
  topics?: TopicScore[];
  /**
   * - `ready`: o resultado.
   * - `loading`: esqueleto no mesmo layout.
   * - `error`: não foi possível calcular.
   */
  status?: "ready" | "loading" | "error";
  /** "Nova Rodada". A única ação primária da tela. */
  onNewRound?: () => void;
  /** "Ver correção". Leva ao `ReviewList`. */
  onReview?: () => void;
  onRetry?: () => void;
  className?: string;
}

const MODE_LABEL = { study: "Modo estudo", mock: "Simulado" } as const;

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Resultado de uma Rodada: acertos/total, por Tópico e as próximas ações. Sem nota, sem elogio. */
export function RoundResult({
  correct,
  total,
  dontKnow = 0,
  mode,
  date,
  topics = [],
  status = "ready",
  onNewRound,
  onReview,
  onRetry,
  className,
}: RoundResultProps) {
  const titleId = useId();
  const classes = ["rresult", className].filter(Boolean).join(" ");
  const meta = [MODE_LABEL[mode], date].filter(Boolean).join(" · ");

  if (status === "loading") {
    return (
      <section className={classes} aria-busy="true" aria-label="Carregando o resultado">
        <SkeletonGroup label="Carregando o resultado">
          <p className="rresult__meta">{meta}</p>
          <Skeleton shape="block" width={180} height={56} />
          <Skeleton width={260} />
          <div className="rresult__skel-rows">
            <Skeleton shape="block" width="100%" height={32} />
            <Skeleton shape="block" width="100%" height={32} />
            <Skeleton shape="block" width="100%" height={32} />
          </div>
        </SkeletonGroup>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className={classes}>
        <div className="rresult__failure" role="alert">
          <TriangleAlert size={24} aria-hidden />
          <h2 className="rresult__failure-title">Não foi possível calcular o resultado</h2>
          <p className="rresult__failure-text">Suas Respostas estão salvas. Tente de novo.</p>
          <Button variant="secondary" icon={<RotateCcw size={18} aria-hidden />} onClick={onRetry}>
            Tentar de novo
          </Button>
        </div>
      </section>
    );
  }

  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);
  const wrong = Math.max(0, total - correct - dontKnow);
  const breakdown = [
    plural(correct, "certa", "certas"),
    plural(wrong, "errada", "erradas"),
    ...(dontKnow > 0 ? [`${dontKnow} Não sei`] : []),
  ].join(", ");

  return (
    <motion.section
      className={classes}
      aria-labelledby={titleId}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition.soft}
    >
      <header className="rresult__head">
        <p className="rresult__meta">{meta}</p>
        <h2 id={titleId} className="rresult__title">
          Resultado da Rodada
        </h2>
      </header>

      <div className="rresult__score">
        <p className="rresult__figure" aria-label={`${correct} de ${total} Perguntas certas, ${percent}%`}>
          <span className="rresult__figure-main">
            {correct}
            <span className="rresult__figure-total">/{total}</span>
          </span>
          <span className="rresult__percent">{percent}%</span>
        </p>
        <p className="rresult__breakdown">{breakdown}</p>
        {dontKnow > 0 && <p className="rresult__note">"Não sei" conta como erro.</p>}
      </div>

      {topics.length > 0 && (
        <section className="rresult__topics" aria-label="Acertos por Tópico">
          <h3 className="rresult__label">Por Tópico</h3>
          <ul className="rresult__list">
            {topics.map((t) => (
              <li key={t.name} className="rresult__row">
                <span className="rresult__topic">{t.name}</span>
                <ProgressBar compact value={t.correct} max={t.total} aria-label={`${t.name}: ${t.correct} de ${t.total}`} />
                <span className="rresult__count">
                  {t.correct}/{t.total}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(onReview || onNewRound) && (
        <footer className="rresult__actions">
          {onReview && (
            <Button variant="secondary" icon={<ListChecks size={18} aria-hidden />} onClick={onReview}>
              Ver correção
            </Button>
          )}
          {onNewRound && (
            <Button icon={<Plus size={18} aria-hidden />} onClick={onNewRound}>
              Nova Rodada
            </Button>
          )}
        </footer>
      )}
    </motion.section>
  );
}
