import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, CircleCheck, CircleHelp, CircleSlash, CircleX, ListChecks, type LucideIcon } from "lucide-react";
import { transition } from "../../motion";
import { Badge } from "../Badge/Badge";
import type { Confidence } from "../ConfidencePicker/ConfidencePicker";
import {
  CorrectionPanel,
  type AlternativeExplanation,
  type ContestationState,
  type CorrectionOutcome,
  type ExcerptReference,
} from "../CorrectionPanel/CorrectionPanel";
import { EmptyState } from "../EmptyState/EmptyState";
import { InlineAlert } from "../InlineAlert/InlineAlert";
import { QuestionCard, type QuestionAlternative } from "../QuestionCard/QuestionCard";
import { Skeleton, SkeletonGroup } from "../Skeleton/Skeleton";
import { Tabs } from "../Tabs/Tabs";
import "./ReviewList.css";

export interface ReviewItem {
  id: string;
  /** Posição na Rodada, na ordem em que a Pergunta foi apresentada. */
  position: number;
  topic: string;
  prompt: ReactNode;
  /** Na ordem em que apareceram para o usuário. */
  alternatives: QuestionAlternative[];
  /** `null` é "Não sei". */
  pickedId: string | null;
  correctId: string;
  /** A Confiança é guardada em todas as Respostas do simulado, mesmo as erradas. */
  confidence?: Confidence;
  explanations: AlternativeExplanation[];
  references?: ExcerptReference[];
  divergence?: ReactNode;
  contestation?: ContestationState;
  /** Pergunta anulada: sem Gabarito nem Explicação. */
  voided?: boolean;
}

export interface ReviewListProps {
  items: ReviewItem[];
  /** Total de Perguntas da Rodada. Maior que `items.length`: a Rodada foi encerrada antes do fim. */
  roundTotal?: number;
  status?: "ready" | "loading";
  /** Ids abertos ao montar. */
  defaultExpanded?: string[];
  onOpenExcerpt?: (itemId: string, referenceIndex: number) => void;
  onContest?: (itemId: string) => void;
  className?: string;
}

const CONFIDENCE_LABEL: Record<Confidence, string> = { certeza: "Tinha certeza", duvida: "Chutei" };

const RESULT: Record<CorrectionOutcome, { label: string; icon: LucideIcon }> = {
  correct: { label: "Certa", icon: CircleCheck },
  wrong: { label: "Errada", icon: CircleX },
  dontknow: { label: "Não sei", icon: CircleHelp },
  voided: { label: "Anulada", icon: CircleSlash },
};

export function outcomeOf(item: ReviewItem): CorrectionOutcome {
  if (item.voided) return "voided";
  if (item.pickedId === null) return "dontknow";
  return item.pickedId === item.correctId ? "correct" : "wrong";
}

/** Correção completa de uma Rodada: simulado terminado ou Rodada passada. Cada Pergunta abre no lugar. */
export function ReviewList({
  items,
  roundTotal,
  status = "ready",
  defaultExpanded = [],
  onOpenExcerpt,
  onContest,
  className,
}: ReviewListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(defaultExpanded));
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const classes = ["review", className].filter(Boolean).join(" ");

  if (status === "loading") {
    return (
      <div className={classes} aria-busy="true">
        <SkeletonGroup label="Carregando a correção">
          <ul className="review__list">
            {[0, 1, 2, 3].map((i) => (
              <li key={i}>
                <Skeleton shape="block" width="100%" height={72} />
              </li>
            ))}
          </ul>
        </SkeletonGroup>
      </div>
    );
  }

  const wrongItems = items.filter((i) => {
    const o = outcomeOf(i);
    return o === "wrong" || o === "dontknow";
  });
  const unanswered = roundTotal !== undefined ? roundTotal - items.length : 0;

  const list = (shown: ReviewItem[]) =>
    shown.length === 0 ? (
      <EmptyState size="compact" icon={<ListChecks size={28} aria-hidden />} title="Nenhuma Pergunta errada">
        Todas as Perguntas respondidas desta Rodada estão certas.
      </EmptyState>
    ) : (
      <ul className="review__list">
        {shown.map((item) => (
          <li key={item.id}>
            <ReviewRow
              item={item}
              open={expanded.has(item.id)}
              onToggle={() => toggle(item.id)}
              onOpenExcerpt={onOpenExcerpt ? (index) => onOpenExcerpt(item.id, index) : undefined}
              onContest={onContest ? () => onContest(item.id) : undefined}
            />
          </li>
        ))}
      </ul>
    );

  return (
    <div className={classes}>
      {unanswered > 0 && (
        <InlineAlert tone="info">
          Rodada encerrada antes do fim. Aparecem só as {items.length} Perguntas respondidas, de {roundTotal}.
        </InlineAlert>
      )}
      <Tabs
        aria-label="Filtrar Perguntas"
        items={[
          { id: "all", label: "Todas", count: items.length, panel: list(items) },
          { id: "wrong", label: "Erradas", count: wrongItems.length, panel: list(wrongItems) },
        ]}
      />
    </div>
  );
}

interface RowProps {
  item: ReviewItem;
  open: boolean;
  onToggle: () => void;
  onOpenExcerpt?: (index: number) => void;
  onContest?: () => void;
}

function ReviewRow({ item, open, onToggle, onOpenExcerpt, onContest }: RowProps) {
  const bodyId = useId();
  const outcome = outcomeOf(item);
  const result = RESULT[outcome];
  const Icon = result.icon;

  return (
    <article className={["review__row", `review__row--${outcome}`, open && "review__row--open"].filter(Boolean).join(" ")}>
      <button type="button" className="review__head" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
        <span className="review__position">{item.position}</span>
        <span className="review__result">
          <Icon size={20} strokeWidth={2.25} aria-hidden />
          {result.label}
        </span>
        <span className="review__summary">
          <span className="review__topic">{item.topic}</span>
          <span className="review__prompt">{item.prompt}</span>
        </span>
        {item.confidence && <Badge>{CONFIDENCE_LABEL[item.confidence]}</Badge>}
        <ChevronDown className="review__chevron" size={20} aria-hidden />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={bodyId}
            className="review__body-wrap"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition.soft}
          >
            <div className="review__body">
              <QuestionCard
                className="review__question"
                topic={item.topic}
                prompt={item.prompt}
                alternatives={item.alternatives}
                answer={{ pickedId: item.pickedId, correctId: item.voided ? undefined : item.correctId }}
                footer={
                  <CorrectionPanel
                    readOnly
                    outcome={outcome}
                    explanations={item.voided ? [] : item.explanations}
                    references={item.references}
                    onOpenExcerpt={onOpenExcerpt}
                    divergence={item.divergence}
                    confidence={item.confidence}
                    contestation={item.contestation}
                    onContest={item.contestation || item.voided ? undefined : onContest}
                  />
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
