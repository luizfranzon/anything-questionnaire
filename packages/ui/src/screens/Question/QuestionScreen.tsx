import { useState } from "react";
import { AppShell } from "../../components/AppShell/AppShell";
import { ConfidencePicker, type Confidence } from "../../components/ConfidencePicker/ConfidencePicker";
import { ContestationForm } from "../../components/Contestation/ContestationForm";
import {
  CorrectionPanel,
  type ContestationState,
  type ExcerptReference,
} from "../../components/CorrectionPanel/CorrectionPanel";
import { QuestionCard, type QuestionAlternative } from "../../components/QuestionCard/QuestionCard";
import { RoundProgress } from "../../components/RoundProgress/RoundProgress";
import { SourceExcerptViewer } from "../../components/SourceExcerptViewer/SourceExcerptViewer";
import "./QuestionScreen.css";

export interface QuestionData {
  topic: string;
  prompt: string;
  /** Na ordem em que aparecem (embaralhadas). */
  alternatives: QuestionAlternative[];
  correctId: string;
  /** Por Alternativa, na ordem: a certa primeiro. A letra vem da posição em `alternatives`. */
  explanations: Record<string, string>;
  references?: ExcerptReference[];
  divergence?: string;
  /** Pergunta que volta por repetição espaçada. */
  review?: boolean;
}

export interface QuestionScreenInitial {
  selectedId?: string | null;
  /** Já respondida. `pickedId: null` é "Não sei". */
  answer?: { pickedId: string | null };
  confidence?: Confidence;
  contestation?: ContestationState;
  contestOpen?: boolean;
  excerpt?: "ready" | "loading" | "error" | "unavailable";
  submitting?: boolean;
  submitError?: boolean;
  confidenceError?: boolean;
  advancing?: boolean;
  /** Simulado: a pessoa tentou responder sem marcar a Confiança. */
  needConfidence?: boolean;
  contestError?: boolean;
  contestSubmitting?: boolean;
}

export interface QuestionScreenProps {
  mode: "study" | "mock";
  round: { current: number; total: number };
  question?: QuestionData;
  status?: "ready" | "loading" | "error" | "voided";
  initial?: QuestionScreenInitial;
  onExit?: () => void;
  onNext?: () => void;
}

const letters = ["A", "B", "C", "D", "E"];

/** Tickets 03, 07 e 17: responder uma Pergunta de cada vez. A tela mais usada do produto. */
export function QuestionScreen({
  mode,
  round,
  question,
  status = "ready",
  initial = {},
  onExit,
  onNext,
}: QuestionScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initial.selectedId ?? null);
  const [answer, setAnswer] = useState(initial.answer);
  const [confidence, setConfidence] = useState<Confidence | undefined>(initial.confidence);
  const [contestation, setContestation] = useState(initial.contestation);
  const [contestOpen, setContestOpen] = useState(!!initial.contestOpen);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [needConfidence, setNeedConfidence] = useState(!!initial.needConfidence);
  const [current, setCurrent] = useState(round.current);

  const q = question;
  const study = mode === "study";
  const last = current >= round.total;
  const dontKnow = answer?.pickedId === null;
  const correct = !!q && !!answer && answer.pickedId === q.correctId;

  const reset = () => {
    setSelectedId(null);
    setAnswer(undefined);
    setConfidence(undefined);
    setContestation(undefined);
    setNeedConfidence(false);
  };

  const submit = (pickedId: string | null) => {
    if (study) {
      setAnswer({ pickedId });
      return;
    }
    if (pickedId !== null && !confidence) {
      setNeedConfidence(true);
      return;
    }
    // Simulado: grava e já vai para a próxima, sem revelar nada.
    if (current < round.total) setCurrent((c) => c + 1);
    reset();
    onNext?.();
  };

  const explanations =
    q?.alternatives.map((alt, i) => ({
      letter: letters[i],
      correct: alt.id === q.correctId,
      picked: answer?.pickedId === alt.id,
      why: q.explanations[alt.id],
    })).sort((a, b) => Number(!!b.correct) - Number(!!a.correct)) ?? [];

  let footer: React.ReactNode;
  if (q && status === "ready") {
    if (study && answer) {
      footer = (
        <CorrectionPanel
          autoFocus
          outcome={dontKnow ? "dontknow" : correct ? "correct" : "wrong"}
          explanations={explanations}
          references={q.references}
          onOpenExcerpt={() => setExcerpt("ready")}
          divergence={q.divergence}
          confidence={correct ? confidence : undefined}
          onConfidenceChange={setConfidence}
          confidenceError={initial.confidenceError}
          contestation={contestation}
          onContest={() => setContestOpen(true)}
          last={last}
          advancing={initial.advancing}
          onNext={() => {
            if (!last) setCurrent((c) => c + 1);
            reset();
            onNext?.();
          }}
        />
      );
    } else if (!study) {
      footer = (
        <ConfidencePicker
          legend={needConfidence && !confidence ? "Marque a Confiança antes de responder" : "Qual era a sua Confiança?"}
          value={confidence}
          onChange={(v) => {
            setConfidence(v);
            setNeedConfidence(false);
          }}
          error={initial.submitError}
        />
      );
    }
  }

  return (
    <AppShell variant="focus" width="reading" onExit={onExit}>
      <div className="question-screen">
        <RoundProgress current={current} total={round.total} currentAnswered={study && !!answer} />
        <QuestionCard
          topic={q?.topic ?? ""}
          prompt={q?.prompt ?? ""}
          alternatives={q?.alternatives ?? []}
          review={q?.review}
          mode={mode}
          status={status}
          selectedId={selectedId}
          onSelect={setSelectedId}
          submitting={initial.submitting}
          submitError={study ? initial.submitError : undefined}
          onSubmit={() => submit(selectedId)}
          onDontKnow={() => submit(null)}
          onRetry={() => undefined}
          onSkip={onNext}
          answer={
            answer && q
              ? { pickedId: answer.pickedId, correctId: study ? q.correctId : undefined }
              : undefined
          }
          footer={footer}
        />
      </div>

      <ContestationForm
        open={contestOpen}
        onClose={() => setContestOpen(false)}
        onSubmit={() => {
          setContestation({ status: "pending" });
          setContestOpen(false);
        }}
        prompt={q?.prompt}
        gabarito={q ? letters[q.alternatives.findIndex((a) => a.id === q.correctId)] : undefined}
        submitting={initial.contestSubmitting}
        error={initial.contestError ? "Não foi possível enviar a Contestação. O texto foi mantido; tente de novo." : undefined}
      />

      <SourceExcerptViewer
        open={!!excerpt}
        onClose={() => setExcerpt(undefined)}
        source={q?.references?.[0]?.source ?? ""}
        kind="pdf"
        location={q?.references?.[0]?.location}
        status={excerpt}
        onRetry={() => undefined}
        excerpt="Uma réplica síncrona confirma cada transação nas duas cópias antes de responder ao cliente. Por isso, se a zona primária falhar, a réplica promovida contém todas as transações confirmadas, ao custo de uma latência maior em cada escrita."
      />
    </AppShell>
  );
}
