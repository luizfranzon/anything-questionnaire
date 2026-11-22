import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Check,
  ChevronDown,
  CircleCheck,
  CircleDashed,
  CircleHelp,
  CircleX,
  Minus,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { transition } from "../../motion";
import { Button } from "../Button/Button";
import { StatusTag, type Status } from "../Badge/Badge";
import { InlineAlert } from "../InlineAlert/InlineAlert";
import { Skeleton, SkeletonGroup } from "../Skeleton/Skeleton";
import "./QuestionBank.css";

/** Resultado de uma Resposta. `guess` é um acerto com Confiança "Chutei"; "Não sei" conta como erro. */
export type AnswerResult = "right" | "guess" | "wrong" | "dontknow";
/** Resultado da última Resposta, ou `never` quando a Pergunta ainda não foi respondida. */
export type BankResult = AnswerResult | "never";
export type BankQuestionStatus = Extract<Status, "active" | "contested" | "voided" | "archived">;

const RESULT: Record<BankResult, { label: string; icon: LucideIcon }> = {
  right: { label: "Acertei", icon: CircleCheck },
  guess: { label: "Chutei", icon: CircleDashed },
  wrong: { label: "Errei", icon: CircleX },
  dontknow: { label: "Não sei", icon: CircleHelp },
  never: { label: "Nunca respondida", icon: Minus },
};

export interface BankAlternative {
  id: string;
  text: ReactNode;
  /** É o Gabarito. Ignorado em Pergunta anulada. */
  correct?: boolean;
  /** Por que está certa ou errada. */
  why?: ReactNode;
}

export interface BankAnswerEntry {
  id: string;
  /** "22/11". */
  date: string;
  mode: "study" | "mock";
  result: AnswerResult;
}

export interface BankReference {
  source: string;
  location?: string;
}

export interface QuestionBankRowProps {
  topic: string;
  prompt: ReactNode;
  /** Última Resposta. */
  result: BankResult;
  /** Só aparece quando não é "Ativa": o normal não precisa de selo. */
  status?: BankQuestionStatus;

  open?: boolean;
  defaultOpen?: boolean;
  /** Avisa ao abrir ou fechar, para quem usa carregar o detalhe ao abrir. */
  onOpenChange?: (open: boolean) => void;

  /**
   * - `ready`: mostra o detalhe.
   * - `loading`: esqueleto do detalhe.
   * - `error`: o detalhe não carregou; "Tentar de novo".
   * Em `loading`, o resto da linha também vira esqueleto quando `skeleton` é verdadeiro.
   */
  detailStatus?: "ready" | "loading" | "error";
  onRetryDetail?: () => void;
  alternatives?: BankAlternative[];
  references?: BankReference[];
  onOpenExcerpt?: (index: number) => void;
  /** O Gabarito diverge da Fonte. */
  divergence?: ReactNode;
  /** Da mais recente para a mais antiga. */
  history?: BankAnswerEntry[];
  /** Respostas mostradas antes de "Ver todas". */
  historyLimit?: number;

  /** Esqueleto da linha inteira (a lista está carregando). */
  skeleton?: boolean;
  className?: string;
  /** Só para a matriz de estados do Storybook. */
  forceState?: "hover" | "focus";
}

const MODE_LABEL = { study: "Modo estudo", mock: "Simulado" } as const;
const LETTERS = "ABCDEFGH";

/** Linha do banco de Perguntas. Use dentro de um `ul`. Abre no lugar e mostra a Pergunta, o Gabarito, a Explicação e o histórico. */
export function QuestionBankRow({
  topic,
  prompt,
  result,
  status = "active",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  detailStatus = "ready",
  onRetryDetail,
  alternatives = [],
  references,
  onOpenExcerpt,
  divergence,
  history = [],
  historyLimit = 5,
  skeleton,
  className,
  forceState,
}: QuestionBankRowProps) {
  const bodyId = useId();
  const [inner, setInner] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);
  const open = openProp ?? inner;
  const toggle = () => {
    const next = !open;
    if (openProp === undefined) setInner(next);
    onOpenChange?.(next);
  };

  if (skeleton) {
    return (
      <li className={["qbrow", className].filter(Boolean).join(" ")} aria-hidden>
        <div className="qbrow__card qbrow__head qbrow__head--skeleton">
          <Skeleton width={96} />
          <div className="qbrow__summary">
            <Skeleton width={120} />
            <Skeleton width="80%" />
          </div>
          <span />
          <span />
        </div>
      </li>
    );
  }

  const { label, icon: Icon } = RESULT[result];
  const dimmed = status === "archived" || status === "voided";
  const voided = status === "voided";
  const shownHistory = showAll ? history : history.slice(0, historyLimit);

  return (
    <li
      className={["qbrow", `qbrow--${result}`, open && "qbrow--open", dimmed && "qbrow--dimmed", className].filter(Boolean).join(" ")}
    >
      <article className="qbrow__card" data-state={forceState}>
        <button type="button" className="qbrow__head" aria-expanded={open} aria-controls={bodyId} onClick={toggle} data-state={forceState}>
          <span className="qbrow__result">
            <Icon size={20} strokeWidth={2.25} aria-hidden />
            {label}
          </span>
          <span className="qbrow__summary">
            <span className="qbrow__topic">{topic}</span>
            <span className="qbrow__prompt">{prompt}</span>
          </span>
          {status !== "active" ? <StatusTag status={status} /> : <span />}
          <ChevronDown className="qbrow__chevron" size={20} aria-hidden />
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={bodyId}
              className="qbrow__wrap"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={transition.soft}
            >
              <div className="qbrow__body">
                {detailStatus === "loading" && (
                  <SkeletonGroup label="Carregando a Pergunta">
                    <Skeleton shape="block" width="100%" height={20} />
                    <Skeleton shape="block" width="100%" height={44} />
                    <Skeleton shape="block" width="100%" height={44} />
                    <Skeleton shape="block" width="100%" height={44} />
                  </SkeletonGroup>
                )}

                {detailStatus === "error" && (
                  <InlineAlert
                    tone="danger"
                    title="Não foi possível abrir a Pergunta"
                    action={
                      onRetryDetail ? (
                        <Button variant="link" icon={<RotateCcw size={16} />} onClick={onRetryDetail}>
                          Tentar de novo
                        </Button>
                      ) : undefined
                    }
                  >
                    Verifique a conexão e tente de novo.
                  </InlineAlert>
                )}

                {detailStatus === "ready" && (
                  <>
                    {voided && (
                      <InlineAlert tone="info" title="Pergunta anulada">
                        O Gabarito não pôde ser confirmado. Ela não conta no Desempenho nem entra em Rodadas.
                      </InlineAlert>
                    )}
                    {status === "archived" && (
                      <InlineAlert tone="info" title="Pergunta arquivada">
                        Fora das Rodadas, das Revisões e do Desempenho. O histórico continua aqui.
                      </InlineAlert>
                    )}

                    <p className="qbrow__full-prompt">{prompt}</p>

                    <ol className="qbrow__alts" aria-label="Alternativas">
                      {alternatives.map((alt, i) => {
                        const correct = !voided && alt.correct;
                        return (
                          <li key={alt.id} className={["qbrow__alt", correct && "qbrow__alt--correct"].filter(Boolean).join(" ")}>
                            <span className="qbrow__letter" aria-hidden>
                              {LETTERS[i]}
                            </span>
                            <span className="qbrow__alt-main">
                              <span className="qbrow__alt-text">
                                {alt.text}
                                {correct && (
                                  <span className="qbrow__key">
                                    <Check size={16} strokeWidth={2.5} aria-hidden />
                                    Gabarito
                                  </span>
                                )}
                              </span>
                              {!voided && alt.why && <span className="qbrow__why">{alt.why}</span>}
                            </span>
                          </li>
                        );
                      })}
                    </ol>

                    {divergence && (
                      <InlineAlert tone="warn" title="O Gabarito diverge da Fonte">
                        {divergence}
                      </InlineAlert>
                    )}

                    {!voided && (
                      <div className="qbrow__origin">
                        <BookOpen size={18} aria-hidden />
                        {references && references.length > 0 ? (
                          <span className="qbrow__origin-list">
                            Origem:
                            {references.map((ref, i) => (
                              <Button key={i} variant="link" onClick={onOpenExcerpt ? () => onOpenExcerpt(i) : undefined}>
                                {ref.location ? `${ref.source} · ${ref.location}` : ref.source}
                              </Button>
                            ))}
                          </span>
                        ) : (
                          <span>Origem: conhecimento geral do Claude</span>
                        )}
                      </div>
                    )}

                    <section className="qbrow__history" aria-label="Histórico de Respostas">
                      <h4 className="qbrow__history-title">Histórico de Respostas</h4>
                      {history.length === 0 ? (
                        <p className="qbrow__history-empty">Ainda não respondida.</p>
                      ) : (
                        <>
                          <ul className="qbrow__history-list">
                            {shownHistory.map((entry) => {
                              const r = RESULT[entry.result];
                              const EntryIcon = r.icon;
                              return (
                                <li key={entry.id} className={`qbrow__entry qbrow__entry--${entry.result}`}>
                                  <span className="qbrow__entry-date">{entry.date}</span>
                                  <span className="qbrow__entry-mode">{MODE_LABEL[entry.mode]}</span>
                                  <span className="qbrow__entry-result">
                                    <EntryIcon size={18} strokeWidth={2.25} aria-hidden />
                                    {r.label}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                          {history.length > historyLimit && (
                            <Button variant="link" onClick={() => setShowAll((v) => !v)}>
                              {showAll ? "Ver menos" : `Ver todas (${history.length})`}
                            </Button>
                          )}
                        </>
                      )}
                    </section>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </article>
    </li>
  );
}
