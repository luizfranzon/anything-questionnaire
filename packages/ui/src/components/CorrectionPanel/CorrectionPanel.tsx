import { useEffect, useId, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  Check,
  CircleCheck,
  CircleHelp,
  CircleSlash,
  CircleX,
  Clock,
  Flag,
  Lightbulb,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "../Button/Button";
import { ConfidencePicker, type Confidence } from "../ConfidencePicker/ConfidencePicker";
import { transition } from "../../motion";
import "./CorrectionPanel.css";

export type CorrectionOutcome = "correct" | "wrong" | "dontknow" | "voided";

export interface AlternativeExplanation {
  /** Letra da Alternativa (A a D), na ordem em que apareceu. */
  letter: string;
  /** Por que está certa ou errada. */
  why: ReactNode;
  /** É a Alternativa certa. */
  correct?: boolean;
  /** Foi a que o usuário marcou. */
  picked?: boolean;
}

export interface ExcerptReference {
  /** Nome da Fonte. */
  source: string;
  /** Localização dentro dela ("p. 14", "12:40"), quando houver. */
  location?: string;
}

export type ContestationState =
  | { status: "pending" }
  | { status: "kept"; justification?: ReactNode }
  | { status: "corrected" }
  | { status: "voided" };

export interface CorrectionPanelProps {
  outcome: CorrectionOutcome;
  /** Explicação por Alternativa: a certa primeiro, depois as erradas. */
  explanations: AlternativeExplanation[];
  /** Fontes e Trechos de origem. Vazio ou omitido: "conhecimento geral do Claude". */
  references?: ExcerptReference[];
  onOpenExcerpt?: (index: number) => void;
  /** O Gabarito diverge da Fonte: o texto do aviso. */
  divergence?: ReactNode;

  /** Confiança. Só é pedida (e só aparece) depois de um acerto. */
  confidence?: Confidence;
  onConfidenceChange?: (value: Confidence) => void;
  /** Falha ao gravar a Confiança. */
  confidenceError?: boolean;
  onRetryConfidence?: () => void;

  /** Contestação: sem valor, mostra "Contestar" (se `onContest` existir). */
  contestation?: ContestationState;
  onContest?: () => void;

  /** Última Pergunta da Rodada: "Próxima" vira "Ver resultado". */
  last?: boolean;
  /** Avançando. Mantém o tamanho do botão. */
  advancing?: boolean;
  onNext?: () => void;
  /** Correção de uma Pergunta já fechada (histórico, simulado terminado): sem "Próxima", Confiança só leitura. */
  readOnly?: boolean;
  /** Leva o foco ao painel ao aparecer, para quem usa teclado ou leitor de tela. */
  autoFocus?: boolean;
  className?: string;
}

const TITLES: Record<CorrectionOutcome, { text: string; icon: ReactNode }> = {
  correct: { text: "Resposta certa", icon: <CircleCheck size={28} aria-hidden /> },
  wrong: { text: "Resposta errada", icon: <CircleX size={28} aria-hidden /> },
  dontknow: { text: "Você respondeu Não sei", icon: <CircleHelp size={28} aria-hidden /> },
  voided: { text: "Pergunta anulada", icon: <CircleSlash size={28} aria-hidden /> },
};

const SUBTITLES: Record<CorrectionOutcome, string> = {
  correct: "",
  wrong: "Veja por que cada Alternativa está certa ou errada.",
  dontknow: "Conta como erro.",
  voided: "O Gabarito não pôde ser confirmado. Esta Pergunta não conta no Desempenho.",
};

const CONTESTATION: Record<ContestationState["status"], { text: string; icon: ReactNode }> = {
  pending: { text: "Contestação em análise", icon: <Clock size={18} aria-hidden /> },
  kept: { text: "Gabarito mantido", icon: <ShieldCheck size={18} aria-hidden /> },
  corrected: { text: "Gabarito corrigido. Sua Resposta passou a acerto", icon: <RefreshCw size={18} aria-hidden /> },
  voided: { text: "Pergunta anulada pela Contestação", icon: <CircleSlash size={18} aria-hidden /> },
};

export function CorrectionPanel({
  outcome,
  explanations,
  references = [],
  onOpenExcerpt,
  divergence,
  confidence,
  onConfidenceChange,
  confidenceError = false,
  onRetryConfidence,
  contestation,
  onContest,
  last = false,
  advancing = false,
  onNext,
  readOnly = false,
  autoFocus = false,
  className,
}: CorrectionPanelProps) {
  const titleId = useId();
  const hintId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (autoFocus) titleRef.current?.focus();
  }, [autoFocus]);

  const title = TITLES[outcome];
  const subtitle = SUBTITLES[outcome];
  const asksConfidence = outcome === "correct" && (!readOnly || confidence !== undefined);
  const waitingConfidence = outcome === "correct" && !readOnly && confidence === undefined;
  const correctOne = explanations.find((e) => e.correct);
  const others = explanations.filter((e) => !e.correct);
  const canContest = outcome !== "voided" && (contestation !== undefined || onContest !== undefined);
  const hasFooter = canContest || !readOnly;

  const classes = ["cpanel", `cpanel--${outcome}`, className].filter(Boolean).join(" ");

  return (
    <motion.section
      className={classes}
      aria-labelledby={titleId}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition.soft}
    >
      <header className="cpanel__header">
        <span className="cpanel__result-icon">{title.icon}</span>
        <div className="cpanel__heading">
          <h3 id={titleId} ref={titleRef} tabIndex={-1} className="cpanel__title">
            {title.text}
          </h3>
          {subtitle && <p className="cpanel__subtitle">{subtitle}</p>}
        </div>
      </header>

      {divergence && (
        <div className="cpanel__divergence" role="note">
          <TriangleAlert size={20} aria-hidden />
          <div>
            <strong>O Gabarito diverge da Fonte.</strong> {divergence}
          </div>
        </div>
      )}

      {correctOne && (
        <section className="cpanel__section" aria-label="Explicação">
          <h4 className="cpanel__label">Explicação</h4>
          <ExplanationItem item={correctOne} />
          {others.length > 0 && (
            <>
              <h4 className="cpanel__label cpanel__label--spaced">As outras Alternativas</h4>
              <ul className="cpanel__list">
                {others.map((item) => (
                  <li key={item.letter}>
                    <ExplanationItem item={item} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {/* Sem Explicação (Pergunta anulada) não há origem a mostrar. */}
      {explanations.length > 0 && (
      <div className="cpanel__origin">
        <h4 className="cpanel__label">Origem</h4>
        {references.length === 0 ? (
          <p className="cpanel__general">
            <Lightbulb size={18} aria-hidden /> Conhecimento geral do Claude
          </p>
        ) : (
          <ul className="cpanel__refs">
            {references.map((ref, i) => (
              <li key={`${ref.source}-${ref.location ?? i}`}>
                <Button
                  variant="link"
                  onDark
                  className="cpanel__ref"
                  icon={<BookOpen size={18} aria-hidden />}
                  onClick={() => onOpenExcerpt?.(i)}
                  title={ref.location ? `${ref.source} · ${ref.location}` : ref.source}
                >
                  <span className="cpanel__ref-name">{ref.source}</span>
                  {ref.location && <span className="cpanel__ref-loc">{ref.location}</span>}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      )}

      {asksConfidence && (
        <div className="cpanel__confidence">
          <ConfidencePicker
            onDark
            value={confidence}
            onChange={onConfidenceChange}
            readOnly={readOnly}
            error={confidenceError}
            onRetry={onRetryConfidence}
          />
        </div>
      )}

      {contestation?.status === "kept" && contestation.justification && (
        <p className="cpanel__justification">{contestation.justification}</p>
      )}

      {hasFooter && (
        <footer className="cpanel__footer">
          {contestation ? (
            <p className="cpanel__contest-status" role="status">
              {CONTESTATION[contestation.status].icon}
              <span>{CONTESTATION[contestation.status].text}</span>
            </p>
          ) : canContest ? (
            <Button variant="secondary" onDark icon={<Flag size={18} aria-hidden />} onClick={onContest}>
              Contestar
            </Button>
          ) : (
            <span />
          )}
          {!readOnly && (
            <Button
              className="cpanel__next"
              icon={last ? <Check size={18} aria-hidden /> : <ArrowRight size={18} aria-hidden />}
              disabled={waitingConfidence}
              loading={advancing}
              onClick={onNext}
              aria-describedby={waitingConfidence ? hintId : undefined}
            >
              {last ? "Ver resultado" : "Próxima"}
            </Button>
          )}
          {waitingConfidence && (
            <span id={hintId} className="cpanel__sr">
              Escolha a Confiança para continuar.
            </span>
          )}
        </footer>
      )}
    </motion.section>
  );
}

function ExplanationItem({ item }: { item: AlternativeExplanation }) {
  const state = item.correct ? "Certa" : item.picked ? "Sua resposta, errada" : "Errada";
  return (
    <div className="cpanel__item" data-correct={item.correct || undefined} data-picked={item.picked || undefined}>
      <span className="cpanel__chip" aria-hidden>
        {item.letter}
      </span>
      <div className="cpanel__item-body">
        <p className="cpanel__item-state">
          {item.correct ? <Check size={16} strokeWidth={2.5} aria-hidden /> : <X size={16} strokeWidth={2.5} aria-hidden />}
          <span>
            <span className="cpanel__sr">Alternativa {item.letter}: </span>
            {state}
          </span>
        </p>
        <div className="cpanel__item-why">{item.why}</div>
      </div>
    </div>
  );
}
