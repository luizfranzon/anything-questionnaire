import { useState } from "react";
import { BookOpen, CloudOff, Plus } from "lucide-react";
import { AppShell } from "../../components/AppShell/AppShell";
import { Button } from "../../components/Button/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { Skeleton } from "../../components/Skeleton/Skeleton";
import { Spinner } from "../../components/Spinner/Spinner";
import { StudyCard } from "../../components/StudyCard/StudyCard";
import { useToast } from "../../components/Toast/Toast";
import "./StudyListScreen.css";

export interface StudyListItem {
  id: string;
  name: string;
  goal: string;
  topicCount: number;
  sourceCount: number;
  lastActivity?: string;
  roundInProgress?: { done: number; total: number };
}

export type StudyListStatus = "ready" | "loading" | "refreshing" | "error";
export type DeleteStep = "confirm" | "saving" | "error";

export interface StudyListScreenProps {
  studies: StudyListItem[];
  status?: StudyListStatus;
  onRetry?: () => void;
  onCreate?: () => void;
  /** Exclui o Estudo. Rejeitar a promessa mostra o erro dentro do diálogo. */
  onDelete?: (id: string) => Promise<void>;
  /** Só para o Storybook: abre o diálogo de exclusão já neste passo. */
  initialDelete?: { id: string; step: DeleteStep };
}

const plural = (n: number) => `${n} ${n === 1 ? "Estudo" : "Estudos"}`;

/** Ticket 01: escolher onde continuar. Uma única primária: "Novo Estudo". */
export function StudyListScreen({
  studies: initial,
  status = "ready",
  onRetry,
  onCreate,
  onDelete,
  initialDelete,
}: StudyListScreenProps) {
  const { toast } = useToast();
  const [studies, setStudies] = useState(initial);
  const [deleting, setDeleting] = useState(initialDelete);
  const target = studies.find((s) => s.id === deleting?.id);

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting({ id: target.id, step: "saving" });
    try {
      await onDelete?.(target.id);
      setStudies((list) => list.filter((s) => s.id !== target.id));
      setDeleting(undefined);
      toast({ tone: "success", title: "Estudo excluído", description: target.name });
    } catch {
      setDeleting({ id: target.id, step: "error" });
    }
  };

  const empty = status === "ready" && studies.length === 0;
  const createButton = (
    <Button icon={<Plus size={18} aria-hidden />} onClick={onCreate}>
      Novo Estudo
    </Button>
  );

  let meta: React.ReactNode;
  if (status === "refreshing") {
    meta = (
      <span className="study-list__refresh">
        <Spinner size="sm" label="Atualizando" />
        Atualizando
      </span>
    );
  } else if (status === "loading") {
    meta = <Skeleton width={72} height={20} />;
  } else if (status === "ready" && studies.length > 0) {
    meta = <span className="study-list__count">{plural(studies.length)}</span>;
  }

  return (
    <AppShell current="studies" width="content">
      <PageHeader
        title="Estudos"
        meta={meta}
        actions={status === "error" || empty ? undefined : createButton}
      />

      {status === "loading" && (
        <ul className="study-list" aria-label="Estudos">
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>
              <StudyCard status="loading" name="" goal="" topicCount={0} sourceCount={0} />
            </li>
          ))}
        </ul>
      )}

      {status === "error" && (
        <EmptyState
          tone="danger"
          icon={<CloudOff size={28} />}
          title="Não foi possível carregar os Estudos"
          action={
            <Button variant="secondary" onClick={onRetry}>
              Tentar de novo
            </Button>
          }
        >
          Confira se o aplicativo está rodando e tente de novo.
        </EmptyState>
      )}

      {empty && (
        <EmptyState icon={<BookOpen size={28} />} title="Nenhum Estudo ainda" action={createButton}>
          Crie um Estudo a partir de um Objetivo. As Fontes você adiciona depois.
        </EmptyState>
      )}

      {(status === "ready" || status === "refreshing") && studies.length > 0 && (
        <ul className="study-list" aria-label="Estudos">
          {studies.map((s) => (
            <li key={s.id}>
              <StudyCard
                {...s}
                href={`#/estudos/${s.id}`}
                onEdit={() => undefined}
                onDelete={() => setDeleting({ id: s.id, step: "confirm" })}
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!target && !!deleting}
        onClose={() => setDeleting(undefined)}
        onConfirm={confirmDelete}
        title={`Excluir o Estudo ${target?.name ?? ""}?`}
        confirmLabel="Excluir Estudo"
        loading={deleting?.step === "saving"}
        error={deleting?.step === "error" ? "Não foi possível excluir o Estudo. Tente de novo." : undefined}
      >
        Os Tópicos, Fontes, Rodadas e Perguntas deste Estudo somem e não dá para desfazer.
      </ConfirmDialog>
    </AppShell>
  );
}
