import { useId, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { AlertTriangle, ArrowRight, CircleSlash, RotateCcw } from "lucide-react";
import { Button } from "../Button/Button";
import { AlternativeOption } from "../AlternativeOption/AlternativeOption";
import { transition } from "../../motion";
import "./QuestionCard.css";

export interface QuestionAlternative {
  id: string;
  text: ReactNode;
}

export interface QuestionCardProps {
  /** Nome do Tópico da Pergunta. */
  topic: string;
  /** Posição na Rodada. */
  position?: { current: number; total: number };
  /** Pergunta que volta por repetição espaçada. */
  review?: boolean;
  /** Enunciado. */
  prompt: ReactNode;
  /** Já na ordem em que devem aparecer (embaralhadas em Revisões). */
  alternatives: QuestionAlternative[];
  /** Modo estudo mostra a correção na hora; simulado só mostra o que foi marcado. */
  mode?: "study" | "mock";
  /**
   * - `ready`: pronta para responder.
   * - `loading`: esqueleto no mesmo layout.
   * - `error`: não carregou (inclui estar offline).
   * - `voided`: a Pergunta foi anulada enquanto estava aberta.
   */
  status?: "ready" | "loading" | "error" | "voided";
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Gravando a Resposta. Mantém o tamanho do botão. */
  submitting?: boolean;
  /** Falha ao gravar a Resposta. */
  submitError?: boolean;
  onSubmit?: () => void;
  onDontKnow?: () => void;
  /** Tentar gravar de novo (submitError) ou carregar de novo (status error). */
  onRetry?: () => void;
  /** Pular a Pergunta anulada. */
  onSkip?: () => void;
  /**
   * Já respondida. `pickedId: null` é "Não sei".
   * No modo estudo, `correctId` revela o Gabarito. No simulado é omitido e só o que foi marcado aparece.
   */
  answer?: { pickedId: string | null; correctId?: string };
  /** Abaixo das ações: Confiança (simulado) ou painel de correção (estudo). */
  footer?: ReactNode;
  className?: string;
}

export function QuestionCard({
  topic,
  position,
  review = false,
  prompt,
  alternatives,
  mode = "study",
  status = "ready",
  selectedId = null,
  onSelect,
  submitting = false,
  submitError = false,
  onSubmit,
  onDontKnow,
  onRetry,
  onSkip,
  answer,
  footer,
  className,
}: QuestionCardProps) {
  const promptId = useId();
  const errorId = useId();
  const answered = answer !== undefined;
  const locked = answered || status === "voided" || submitting;
  const classes = ["qcard", `qcard--${status}`, className].filter(Boolean).join(" ");

  // Teclas 1 a 4 marcam a Alternativa, exceto quando o foco está num campo de texto.
  const onKeyDown = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable]") || e.ctrlKey || e.metaKey || e.altKey) return;
    const n = Number(e.key);
    if (!locked && status === "ready" && n >= 1 && n <= alternatives.length) onSelect?.(alternatives[n - 1].id);
  };

  const header = (
    <header className="qcard__header">
      <span className="qcard__topic">{topic}</span>
      <span className="qcard__meta">
        {review && <span className="qcard__tag">Revisão</span>}
        {position && (
          <span className="qcard__position">
            {position.current} de {position.total}
          </span>
        )}
      </span>
    </header>
  );

  if (status === "loading") {
    return (
      <section className={classes} aria-busy="true" aria-label="Carregando a Pergunta">
        {header}
        <div className="qcard__skel qcard__skel--prompt" />
        <div className="qcard__alts">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="qcard__skel qcard__skel--alt" />
          ))}
        </div>
        <div className="qcard__actions">
          <div className="qcard__skel qcard__skel--button" />
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className={classes}>
        <div className="qcard__failure" role="alert">
          <AlertTriangle size={24} aria-hidden />
          <h2 className="qcard__failure-title">Não foi possível carregar a Pergunta</h2>
          <p className="qcard__failure-text">Verifique a conexão e tente de novo. Sua Rodada continua salva.</p>
          <Button variant="secondary" icon={<RotateCcw size={18} aria-hidden />} onClick={onRetry}>
            Tentar de novo
          </Button>
        </div>
      </section>
    );
  }

  const liveMessage = answered
    ? answer.pickedId === null
      ? "Você respondeu Não sei."
      : mode === "study" && answer.correctId
        ? answer.pickedId === answer.correctId
          ? "Resposta certa."
          : "Resposta errada."
        : "Resposta enviada."
    : "";

  const summary = !answered
    ? ""
    : answer.pickedId === null
      ? "Você respondeu Não sei. Conta como erro."
      : mode === "mock"
        ? "Resposta enviada. A correção aparece no fim da Rodada."
        : "";

  return (
    <section className={classes} onKeyDown={onKeyDown} aria-labelledby={promptId}>
      {header}

      {status === "voided" && (
        <motion.div
          className="qcard__notice"
          role="status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition.fade}
        >
          <CircleSlash size={20} aria-hidden />
          <div>
            <strong>Esta Pergunta foi anulada.</strong> O Gabarito não pôde ser confirmado, então ela não conta no
            Desempenho.
          </div>
          <Button variant="secondary" icon={<ArrowRight size={18} aria-hidden />} onClick={onSkip}>
            Pular
          </Button>
        </motion.div>
      )}

      <h2 id={promptId} className="qcard__prompt">
        {prompt}
      </h2>

      <div className="qcard__alts" role="radiogroup" aria-labelledby={promptId}>
        {alternatives.map((alt, i) => {
          const picked = answer ? answer.pickedId === alt.id : selectedId === alt.id;
          const isCorrect = mode === "study" && answer?.correctId === alt.id;
          const result = isCorrect ? "correct" : mode === "study" && answer && picked ? "wrong" : undefined;
          return (
            <AlternativeOption
              key={alt.id}
              shortcut={String(i + 1)}
              selected={picked}
              result={result}
              readOnly={locked}
              onClick={() => onSelect?.(alt.id)}
            >
              {alt.text}
            </AlternativeOption>
          );
        })}
      </div>

      {/* Respondida: as ações viram uma linha de resumo (some no estudo, onde o painel de correção assume). */}
      {(!answered || summary) && (
      <div className="qcard__actions">
        {answered ? (
          <p className="qcard__summary">{summary}</p>
        ) : (
          <>
            <Button variant="secondary" disabled={locked} onClick={onDontKnow}>
              Não sei
            </Button>
            <Button
              className="qcard__submit"
              icon={<ArrowRight size={18} aria-hidden />}
              disabled={selectedId === null || status === "voided"}
              loading={submitting}
              onClick={onSubmit}
              aria-describedby={submitError ? errorId : undefined}
            >
              Responder
            </Button>
            {submitError && (
              <p id={errorId} className="qcard__error" role="alert">
                <AlertTriangle size={16} aria-hidden /> Não foi possível gravar a Resposta.
                <Button variant="link" onClick={onRetry}>
                  Tentar de novo
                </Button>
              </p>
            )}
          </>
        )}
      </div>
      )}

      <span className="qcard__sr" aria-live="polite">
        {liveMessage}
      </span>

      {footer}
    </section>
  );
}
