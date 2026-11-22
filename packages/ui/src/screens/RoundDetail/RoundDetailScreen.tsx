import { useState } from "react";
import { CloudOff } from "lucide-react";
import { AppShell } from "../../components/AppShell/AppShell";
import { Badge } from "../../components/Badge/Badge";
import { Button } from "../../components/Button/Button";
import { ContestationForm } from "../../components/Contestation/ContestationForm";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { ReviewList, type ReviewItem } from "../../components/ReviewList/ReviewList";
import { SourceExcerptViewer } from "../../components/SourceExcerptViewer/SourceExcerptViewer";

export interface RoundDetailScreenProps {
  studyName: string;
  date: string;
  mode: "study" | "mock";
  items: ReviewItem[];
  /** Perguntas da Rodada. Maior que `items.length`: foi encerrada antes do fim. */
  roundTotal?: number;
  status?: "ready" | "loading" | "error";
  /** Só para o Storybook: abre o Trecho ou o formulário de Contestação já na carga. */
  initial?: { excerpt?: "ready" | "loading" | "error" | "unavailable"; contestItem?: string; expanded?: string[] };
  onRetry?: () => void;
}

/** Tickets 07, 09 e 17: rever uma Rodada, com a correção completa de cada Pergunta. */
export function RoundDetailScreen({
  studyName,
  date,
  mode,
  items,
  roundTotal,
  status = "ready",
  initial,
  onRetry,
}: RoundDetailScreenProps) {
  const [excerpt, setExcerpt] = useState<{ itemId: string; index: number } | undefined>(
    initial?.excerpt && items[0] ? { itemId: items[0].id, index: 0 } : undefined,
  );
  const [excerptStatus, setExcerptStatus] = useState(initial?.excerpt ?? "ready");
  const [contestId, setContestId] = useState(initial?.contestItem);
  const [contested, setContested] = useState<Record<string, true>>({});

  const ended = roundTotal !== undefined && roundTotal > items.length;
  const contestItem = items.find((i) => i.id === contestId);
  const excerptItem = items.find((i) => i.id === excerpt?.itemId);
  const ref = excerptItem?.references?.[excerpt?.index ?? 0];

  const shown = items.map((i) => (contested[i.id] ? { ...i, contestation: { status: "pending" as const } } : i));

  return (
    <AppShell current="studies" width="content">
      <PageHeader
        back={{ label: studyName, href: "#/estudos/1" }}
        title={`Rodada de ${date}`}
        meta={
          <>
            <Badge tone="neutral">{mode === "mock" ? "Simulado" : "Estudo"}</Badge>
            {ended && <Badge tone="neutral">Encerrada</Badge>}
          </>
        }
      />

      {status === "error" ? (
        <EmptyState
          tone="danger"
          icon={<CloudOff size={28} />}
          title="Não foi possível carregar a Rodada"
          action={
            <Button variant="secondary" onClick={onRetry}>
              Tentar de novo
            </Button>
          }
        >
          Tente de novo ou volte para o Estudo.
        </EmptyState>
      ) : (
        <ReviewList
          items={shown}
          roundTotal={roundTotal}
          status={status === "loading" ? "loading" : "ready"}
          defaultExpanded={initial?.expanded}
          onOpenExcerpt={(itemId, index) => {
            setExcerptStatus("ready");
            setExcerpt({ itemId, index });
          }}
          onContest={setContestId}
        />
      )}

      <ContestationForm
        open={!!contestItem}
        onClose={() => setContestId(undefined)}
        onSubmit={() => {
          if (contestId) setContested((c) => ({ ...c, [contestId]: true }));
          setContestId(undefined);
        }}
        prompt={contestItem?.prompt}
        gabarito={
          contestItem
            ? String.fromCharCode(65 + contestItem.alternatives.findIndex((a) => a.id === contestItem.correctId))
            : undefined
        }
      />

      <SourceExcerptViewer
        open={!!excerpt}
        onClose={() => setExcerpt(undefined)}
        source={ref?.source ?? ""}
        kind="pdf"
        location={ref?.location}
        status={excerptStatus}
        onRetry={() => setExcerptStatus("ready")}
        excerpt="Uma réplica síncrona confirma cada transação nas duas cópias antes de responder ao cliente. Por isso, se a zona primária falhar, a réplica promovida contém todas as transações confirmadas."
      />
    </AppShell>
  );
}
