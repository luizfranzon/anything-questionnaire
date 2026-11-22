import { useState } from "react";
import { CloudOff } from "lucide-react";
import { AppShell } from "../../components/AppShell/AppShell";
import { Button } from "../../components/Button/Button";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { InlineAlert } from "../../components/InlineAlert/InlineAlert";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { ProgressBar } from "../../components/ProgressBar/ProgressBar";
import {
  TopicProposalEditor,
  type EditableTopic,
} from "../../components/TopicProposalEditor/TopicProposalEditor";
import "./TopicProposalScreen.css";

export type ProposalPhase = "generating" | "retrying" | "failed" | "ready";

export interface TopicProposalScreenProps {
  studyName: string;
  phase: ProposalPhase;
  topics?: EditableTopic[];
  /** Proposta de um Estudo que já tem Tópicos: o Claude sugere só os novos. */
  incremental?: boolean;
  /** Gravando a aprovação. */
  saving?: boolean;
  saveError?: string;
  onRetry?: () => void;
  onApprove?: (topics: EditableTopic[]) => void;
}

let nextId = 1000;

/** Ticket 02 e 11: acompanhar a proposta, revisar os Tópicos e aprovar. */
export function TopicProposalScreen({
  studyName,
  phase,
  topics: initial = [],
  incremental,
  saving,
  saveError,
  onRetry,
  onApprove,
}: TopicProposalScreenProps) {
  const [topics, setTopics] = useState(initial);

  return (
    <AppShell current="studies" width="reading">
      <PageHeader
        back={{ label: studyName, href: "#/estudos/1" }}
        title={incremental ? "Tópicos novos" : "Tópicos propostos"}
        description={
          incremental
            ? "Com as Fontes novas, o Claude sugere só o que ainda não está no Estudo. Os Tópicos que você já aprovou ficam como estão."
            : "O Claude propôs estes Tópicos a partir do Objetivo e das Fontes. Renomeie, junte, apague ou adicione antes de aprovar."
        }
      />

      {(phase === "generating" || phase === "retrying") && (
        <div className="topic-proposal__progress">
          {phase === "retrying" && (
            <InlineAlert tone="warn" title="O Claude está sobrecarregado">
              A proposta falhou por um erro passageiro e está sendo tentada de novo. Nada para fazer por enquanto.
            </InlineAlert>
          )}
          <ProgressBar
            indeterminate
            label={phase === "retrying" ? "Tentando de novo" : "Propondo Tópicos"}
            valueText={false}
          />
          <p className="topic-proposal__note">
            Você pode fechar esta aba. A proposta continua e estará aqui quando voltar.
          </p>
        </div>
      )}

      {phase === "failed" && (
        <EmptyState
          tone="danger"
          icon={<CloudOff size={28} />}
          title="Não foi possível propor os Tópicos"
          action={
            <Button variant="secondary" onClick={onRetry}>
              Tentar de novo
            </Button>
          }
        >
          Depois de várias tentativas, o Claude não respondeu. O Estudo e as Fontes continuam como estavam.
        </EmptyState>
      )}

      {phase === "ready" && (
        <TopicProposalEditor
          mode="proposal"
          topics={topics}
          status={saving ? "saving" : "ready"}
          error={saveError}
          onRename={(id, name) => setTopics((l) => l.map((t) => (t.id === id ? { ...t, name } : t)))}
          onMerge={(ids, targetId) => setTopics((l) => l.filter((t) => t.id === targetId || !ids.includes(t.id)))}
          onAdd={(name) => setTopics((l) => [...l, { id: `n${nextId++}`, name }])}
          onRemove={(id) => setTopics((l) => l.filter((t) => t.id !== id))}
          onApprove={() => onApprove?.(topics)}
        />
      )}
    </AppShell>
  );
}
