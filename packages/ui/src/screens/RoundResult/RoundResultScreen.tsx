import { AppShell } from "../../components/AppShell/AppShell";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { RoundResult, type RoundResultProps } from "../../components/RoundResult/RoundResult";

export interface RoundResultScreenProps extends Omit<RoundResultProps, "onNewRound" | "onReview" | "onRetry"> {
  studyName: string;
  /** Sem correção para abrir (ex.: nenhuma Pergunta respondida): esconde "Ver correção". */
  canReview?: boolean;
  onNewRound?: () => void;
  onReview?: () => void;
  onRetry?: () => void;
}

/** Tickets 03 e 07: o resultado ao fim da Rodada. Primária: "Nova Rodada". */
export function RoundResultScreen({
  studyName,
  canReview = true,
  onNewRound,
  onReview,
  onRetry,
  ...result
}: RoundResultScreenProps) {
  return (
    <AppShell current="studies" width="reading">
      <PageHeader back={{ label: studyName, href: "#/estudos/1" }} title="Resultado da Rodada" />
      <RoundResult
        {...result}
        onNewRound={onNewRound ?? (() => undefined)}
        onReview={canReview ? (onReview ?? (() => undefined)) : undefined}
        onRetry={onRetry}
      />
    </AppShell>
  );
}
