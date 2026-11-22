import { useMemo, useState, type ReactNode } from "react";
import { CloudOff, FileQuestion, History, Layers, Pencil, Plus, SearchX } from "lucide-react";
import { AppShell } from "../../components/AppShell/AppShell";
import { Button } from "../../components/Button/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { InlineAlert } from "../../components/InlineAlert/InlineAlert";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { Pagination } from "../../components/Pagination/Pagination";
import { QuestionBankFilters, emptyBankFilters, type QuestionBankFilterValue } from "../../components/QuestionBank/QuestionBankFilters";
import {
  QuestionBankRow,
  type BankAlternative,
  type BankQuestionStatus,
  type BankResult,
} from "../../components/QuestionBank/QuestionBankRow";
import { RoundHistoryRow, type RoundHistoryRowProps } from "../../components/RoundHistoryRow/RoundHistoryRow";
import { RoundInProgressBanner } from "../../components/RoundInProgressBanner/RoundInProgressBanner";
import { Skeleton, SkeletonGroup } from "../../components/Skeleton/Skeleton";
import { SourceAddForm } from "../../components/SourceAddForm/SourceAddForm";
import { SourceRow, type SourceRowProps } from "../../components/SourceRow/SourceRow";
import { Tabs } from "../../components/Tabs/Tabs";
import { TopicProposalEditor, type EditableTopic } from "../../components/TopicProposalEditor/TopicProposalEditor";
import { TopicRow, type TopicRowProps } from "../../components/TopicRow/TopicRow";
import { Badge } from "../../components/Badge/Badge";
import "./StudyPageScreen.css";

export type StudyTopic = Omit<TopicRowProps, "status"> & { id: string };
export type StudyRound = Omit<RoundHistoryRowProps, "status" | "onOpen"> & { id: string };
export interface StudyQuestion {
  id: string;
  topicId: string;
  topic: string;
  prompt: string;
  result: BankResult;
  status?: BankQuestionStatus;
  alternatives?: BankAlternative[];
}
export type StudySource = Omit<SourceRowProps, "onRemove" | "onRetry"> & { id: string };

export interface StudyPageData {
  id: string;
  name: string;
  goal: string;
  topics: StudyTopic[];
  /** Tópicos aprovados que o Claude propôs e que ainda esperam aprovação. */
  proposalPending?: boolean;
  dueReviews: number;
  roundInProgress?: { done: number; total: number; mode: "study" | "mock"; startedAt?: string };
  rounds: StudyRound[];
  questions: StudyQuestion[];
  sources: StudySource[];
}

export type StudyTabId = "topics" | "rounds" | "questions" | "sources" | "manage";

export interface StudyPageScreenProps {
  /** `loading`: primeira carga da página. `error`: o Estudo não carregou. */
  status?: "ready" | "loading" | "error";
  data?: StudyPageData;
  initialTab?: StudyTabId;
  /** Estado só da aba Perguntas. */
  questionsStatus?: "ready" | "loading" | "error";
  initialFilters?: QuestionBankFilterValue;
  /** Quando há Rodada em andamento e a pessoa clica em "Continuar". */
  resuming?: boolean;
  onRetry?: () => void;
}

const PAGE_SIZE = 20;
const RESULT_MAP: Record<string, BankResult[]> = {
  wrong: ["wrong", "dontknow"],
  guess: ["guess"],
  right: ["right"],
  never: ["never"],
};

function Panel({ children }: { children: ReactNode }) {
  return <div className="study-page__panel">{children}</div>;
}

/** Tickets 05, 08, 09, 10, 11, 15 e 16: o Estudo por dentro. Uma primária: "Nova Rodada". */
export function StudyPageScreen({
  status = "ready",
  data,
  initialTab = "topics",
  questionsStatus = "ready",
  initialFilters = emptyBankFilters,
  resuming,
  onRetry,
}: StudyPageScreenProps) {
  const [tab, setTab] = useState<StudyTabId>(initialTab);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [managed, setManaged] = useState<EditableTopic[]>(
    () => data?.topics.map((t) => ({ id: t.id, name: t.name, archived: t.archived, questionCount: t.answers })) ?? [],
  );
  const [sources, setSources] = useState(data?.sources ?? []);

  const bank = useMemoBank(data?.questions ?? [], filters);

  const header = (extra?: Partial<React.ComponentProps<typeof PageHeader>>) => (
    <PageHeader back={{ label: "Estudos", href: "#/estudos" }} title={data?.name ?? "Estudo"} {...extra} />
  );

  if (status === "error") {
    return (
      <AppShell current="studies" width="content">
        {header({ title: "Estudo" })}
        <EmptyState
          tone="danger"
          icon={<CloudOff size={28} />}
          title="Não foi possível carregar o Estudo"
          action={
            <Button variant="secondary" onClick={onRetry}>
              Tentar de novo
            </Button>
          }
        >
          Tente de novo ou volte para a lista de Estudos.
        </EmptyState>
      </AppShell>
    );
  }

  if (status === "loading" || !data) {
    return (
      <AppShell current="studies" width="content">
        <PageHeader back={{ label: "Estudos", href: "#/estudos" }} title="" loading description="" actions={<Button disabled>Nova Rodada</Button>} />
        <SkeletonGroup label="Carregando o Estudo">
          <div className="study-page__loading">
            <Skeleton shape="block" height={40} />
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} shape="block" height={56} />
            ))}
          </div>
        </SkeletonGroup>
      </AppShell>
    );
  }

  const approved = data.topics.filter((t) => !t.archived);
  const noTopics = approved.length === 0;
  const progress = data.roundInProgress;

  const pageCount = Math.max(1, Math.ceil(bank.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = bank.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtersActive = filters.topic !== "all" || filters.result !== "all" || filters.status !== "all";

  const ordered = [...approved].sort((a, b) => (a.performance ?? -1) - (b.performance ?? -1));

  const topicsPanel = (
    <Panel>
      {data.dueReviews > 0 && (
        <InlineAlert
          tone="info"
          title={`${data.dueReviews} ${data.dueReviews === 1 ? "Revisão vencida" : "Revisões vencidas"} hoje`}
          action={<Button variant="link">Criar Rodada com Revisões</Button>}
        >
          Elas entram primeiro na próxima Rodada, até 30% das Perguntas.
        </InlineAlert>
      )}
      {noTopics ? (
        <EmptyState icon={<Layers size={28} />} title="Nenhum Tópico aprovado" size="compact" outlined>
          Aprove os Tópicos propostos para o Desempenho aparecer aqui.
        </EmptyState>
      ) : (
        <ul className="study-page__list" aria-label="Tópicos do mais fraco ao mais forte">
          {ordered.map((t) => (
            <TopicRow key={t.id} {...t} />
          ))}
        </ul>
      )}
    </Panel>
  );

  const roundsPanel = (
    <Panel>
      {data.rounds.length === 0 ? (
        <EmptyState icon={<History size={28} />} title="Nenhuma Rodada ainda" size="compact" outlined>
          As Rodadas que você terminar ou encerrar aparecem aqui, da mais recente para a mais antiga.
        </EmptyState>
      ) : (
        <ul className="study-page__list" aria-label="Histórico de Rodadas">
          {data.rounds.map((r) => (
            <RoundHistoryRow key={r.id} {...r} href={`#/rodadas/${r.id}`} />
          ))}
        </ul>
      )}
    </Panel>
  );

  const questionsPanel = (
    <Panel>
      <QuestionBankFilters
        topics={data.topics.map((t) => ({ value: t.id, label: t.name }))}
        value={filters}
        onChange={(v) => {
          setFilters(v);
          setPage(1);
        }}
        total={data.questions.length}
        shown={bank.length}
        loading={questionsStatus === "loading"}
        disabled={data.questions.length === 0}
      />
      {questionsStatus === "loading" && (
        <ul className="study-page__list" aria-label="Carregando Perguntas">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <QuestionBankRow key={i} skeleton topic="" prompt="" result="never" />
          ))}
        </ul>
      )}
      {questionsStatus === "error" && (
        <EmptyState
          tone="danger"
          size="compact"
          icon={<CloudOff size={28} />}
          title="Não foi possível carregar as Perguntas"
          action={
            <Button variant="secondary" onClick={onRetry}>
              Tentar de novo
            </Button>
          }
        />
      )}
      {questionsStatus === "ready" && data.questions.length === 0 && (
        <EmptyState icon={<FileQuestion size={28} />} title="Nenhuma Pergunta ainda" size="compact" outlined>
          As Perguntas aparecem aqui depois da primeira Rodada.
        </EmptyState>
      )}
      {questionsStatus === "ready" && data.questions.length > 0 && bank.length === 0 && (
        <EmptyState
          icon={<SearchX size={28} />}
          title="Nenhuma Pergunta com esses filtros"
          size="compact"
          action={
            <Button variant="secondary" onClick={() => setFilters(emptyBankFilters)}>
              Limpar filtros
            </Button>
          }
        >
          Troque ou limpe os filtros para ver as outras Perguntas.
        </EmptyState>
      )}
      {questionsStatus === "ready" && visible.length > 0 && (
        <>
          <ul className="study-page__list" aria-label="Perguntas do Estudo">
            {visible.map((q) => (
              <QuestionBankRow
                key={q.id}
                topic={q.topic}
                prompt={q.prompt}
                result={q.result}
                status={q.status}
                alternatives={q.alternatives}
                references={[]}
              />
            ))}
          </ul>
          <Pagination
            page={current}
            pageCount={pageCount}
            onPageChange={setPage}
            total={bank.length}
            pageSize={PAGE_SIZE}
          />
        </>
      )}
    </Panel>
  );

  const sourcesPanel = (
    <Panel>
      <SourceAddForm
        collapsible={sources.length > 0}
        files={{ files: [], onAdd: () => undefined, onRemove: () => undefined, onRetry: () => undefined }}
        onSubmit={() => undefined}
      />
      {sources.length > 0 && (
        <ul className="study-page__list" aria-label="Fontes do Estudo">
          {sources.map((s) => (
            <SourceRow
              key={s.id}
              {...s}
              onRemove={() => setSources((l) => l.filter((x) => x.id !== s.id))}
              onRetry={s.status === "failed" ? () => undefined : undefined}
            />
          ))}
        </ul>
      )}
    </Panel>
  );

  const managePanel = (
    <Panel>
      <TopicProposalEditor
        mode="managed"
        topics={managed}
        onRename={(id, name) => setManaged((l) => l.map((t) => (t.id === id ? { ...t, name } : t)))}
        onMerge={(ids, target) => setManaged((l) => l.filter((t) => t.id === target || !ids.includes(t.id)))}
        onAdd={(name) => setManaged((l) => [...l, { id: `n${l.length}`, name, questionCount: 0 }])}
        onArchive={(id) => setManaged((l) => l.map((t) => (t.id === id ? { ...t, archived: true } : t)))}
        onReactivate={(id) => setManaged((l) => l.map((t) => (t.id === id ? { ...t, archived: false } : t)))}
      />
    </Panel>
  );

  return (
    <AppShell current="studies" width="content">
      <PageHeader
        back={{ label: "Estudos", href: "#/estudos" }}
        title={data.name}
        description={data.goal}
        meta={
          data.proposalPending ? (
            <Badge tone="warn">Tópicos por aprovar</Badge>
          ) : undefined
        }
        actions={
          <>
            <Button variant="secondary" icon={<Pencil size={18} aria-hidden />}>
              Editar
            </Button>
            <Button icon={<Plus size={18} aria-hidden />} disabled={noTopics}>
              Nova Rodada
            </Button>
          </>
        }
      />

      <div className="study-page__stack">
      {data.proposalPending && (
        <InlineAlert
          tone="warn"
          title="Há Tópicos propostos esperando aprovação"
          action={<Button variant="link">Revisar proposta</Button>}
        >
          Sem Tópicos aprovados não dá para criar uma Rodada.
        </InlineAlert>
      )}

      {progress && (
        <RoundInProgressBanner
          done={progress.done}
          total={progress.total}
          mode={progress.mode}
          startedAt={progress.startedAt}
          resuming={resuming}
          onResume={() => undefined}
        />
      )}
      </div>

      <Tabs
        aria-label="Seções do Estudo"
        value={tab}
        onValueChange={(id) => setTab(id as StudyTabId)}
        items={[
          { id: "topics", label: "Tópicos", count: approved.length, panel: topicsPanel },
          { id: "rounds", label: "Rodadas", count: data.rounds.length, panel: roundsPanel },
          { id: "questions", label: "Perguntas", count: data.questions.length, panel: questionsPanel },
          { id: "sources", label: "Fontes", count: sources.length, panel: sourcesPanel },
          { id: "manage", label: "Gerenciar Tópicos", panel: managePanel },
        ]}
      />
    </AppShell>
  );
}

function useMemoBank(questions: StudyQuestion[], f: QuestionBankFilterValue) {
  return useMemo(
    () =>
      questions.filter(
        (q) =>
          (f.topic === "all" || q.topicId === f.topic) &&
          (f.result === "all" || (RESULT_MAP[f.result] ?? []).includes(q.result)) &&
          (f.status === "all" || (q.status ?? "active") === f.status),
      ),
    [questions, f],
  );
}
