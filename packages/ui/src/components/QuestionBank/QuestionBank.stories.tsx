import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Layers, SearchX } from "lucide-react";
import { Button } from "../Button/Button";
import { EmptyState } from "../EmptyState/EmptyState";
import { Pagination } from "../Pagination/Pagination";
import { Skeleton } from "../Skeleton/Skeleton";
import {
  QuestionBankFilters,
  emptyBankFilters,
  type BankResultFilter,
  type BankStatusFilter,
  type QuestionBankFilterValue,
} from "./QuestionBankFilters";
import { QuestionBankRow, type BankAlternative, type BankAnswerEntry, type BankResult, type QuestionBankRowProps } from "./QuestionBankRow";

const topics = [
  { value: "ha", label: "Alta disponibilidade" },
  { value: "lb", label: "Balanceamento de carga" },
  { value: "rep", label: "Replicação de dados entre regiões e estratégias de failover" },
  { value: "dns", label: "DNS" },
];

const alternatives: BankAlternative[] = [
  { id: "a", text: "Aumentar o TTL do registro DNS para 24 horas.", why: "Um TTL alto atrasa a propagação do failover." },
  {
    id: "b",
    text: "Manter uma réplica síncrona em outra zona de disponibilidade e promovê-la quando a primária falhar.",
    correct: true,
    why: "A réplica síncrona não perde dados confirmados e a promoção mantém o serviço no ar.",
  },
  { id: "c", text: "Fazer backup diário e restaurar quando houver falha.", why: "O tempo de restauração viola o objetivo de recuperação." },
  { id: "d", text: "Adicionar mais memória ao servidor primário.", why: "Capacidade não protege contra a falha do servidor." },
];

const history: BankAnswerEntry[] = [
  { id: "1", date: "22/11", mode: "study", result: "right" },
  { id: "2", date: "20/11", mode: "mock", result: "wrong" },
  { id: "3", date: "18/11", mode: "study", result: "guess" },
  { id: "4", date: "15/11", mode: "study", result: "dontknow" },
  { id: "5", date: "12/11", mode: "study", result: "wrong" },
  { id: "6", date: "09/11", mode: "mock", result: "wrong" },
  { id: "7", date: "05/11", mode: "study", result: "wrong" },
];

const longPrompt =
  "Uma empresa precisa garantir que o banco de dados de pedidos continue disponível, sem perda de transações confirmadas, quando uma zona de disponibilidade inteira ficar indisponível. Qual abordagem atende melhor a esse requisito?";

const meta = {
  title: "Componentes/QuestionBank",
  component: QuestionBankRow,
  args: {
    topic: "Replicação de dados entre regiões e estratégias de failover",
    prompt: longPrompt,
    result: "wrong",
    alternatives,
    history,
    references: [{ source: "Guia de alta disponibilidade.pdf", location: "p. 14" }],
    onOpenExcerpt: () => {},
  },
  decorators: [
    (Story) => (
      <ul style={{ margin: 0, padding: 0, maxWidth: "var(--width-content)" }}>
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof QuestionBankRow>;
export default meta;
type Story = StoryObj<typeof meta>;

/* ---- Linha ---- */
export const Errei: Story = { args: { result: "wrong" } };
export const Chutei: Story = { args: { result: "guess" } };
export const Acertei: Story = { args: { result: "right" } };
export const NaoSei: Story = { name: "Não sei", args: { result: "dontknow" } };
export const NuncaRespondida: Story = { name: "Nunca respondida", args: { result: "never", history: [] } };
export const Hover: Story = { args: { forceState: "hover" } };
export const Foco: Story = { args: { forceState: "focus" } };
export const Contestada: Story = { args: { status: "contested" } };
export const Anulada: Story = { args: { status: "voided", result: "never", history: [] } };
export const Arquivada: Story = { args: { status: "archived" } };
export const EsqueletoDaLinha: Story = { name: "Esqueleto da linha", args: { skeleton: true } };

/* ---- Detalhe aberto ---- */
export const Aberta: Story = { args: { defaultOpen: true } };
export const AbertaNuncaRespondida: Story = { name: "Aberta, nunca respondida", args: { defaultOpen: true, result: "never", history: [] } };
export const AbertaConhecimentoGeral: Story = { name: "Aberta, conhecimento geral", args: { defaultOpen: true, references: [] } };
export const AbertaComDivergencia: Story = {
  name: "Aberta, com divergência",
  args: { defaultOpen: true, divergence: "A Fonte diz TTL de 24 horas; a documentação oficial recomenda valores baixos para failover." },
};
export const AbertaAnulada: Story = { name: "Aberta, anulada", args: { defaultOpen: true, status: "voided" } };
export const AbertaArquivada: Story = { name: "Aberta, arquivada", args: { defaultOpen: true, status: "archived" } };
export const AbertaCarregando: Story = { name: "Aberta, carregando o detalhe", args: { defaultOpen: true, detailStatus: "loading" } };
export const AbertaComErro: Story = { name: "Aberta, erro ao carregar", args: { defaultOpen: true, detailStatus: "error", onRetryDetail: () => {} } };

/** Abrir carrega o detalhe por 1s e a primeira tentativa falha. */
export const AbrirCarregandoDetalhe: Story = {
  name: "Abrir carrega o detalhe",
  render: (args) => {
    const [state, setState] = useState<QuestionBankRowProps["detailStatus"]>("loading");
    const [tries, setTries] = useState(0);
    const load = () => {
      setState("loading");
      setTimeout(() => {
        if (tries === 0) {
          setTries(1);
          setState("error");
        } else setState("ready");
      }, 1000);
    };
    return <QuestionBankRow {...args} detailStatus={state} onRetryDetail={load} onOpenChange={(o) => o && load()} />;
  },
};

/* ---- Filtros ---- */
const FilterBar = (props: Partial<React.ComponentProps<typeof QuestionBankFilters>> & { start?: QuestionBankFilterValue }) => {
  const [value, setValue] = useState(props.start ?? emptyBankFilters);
  return (
    <QuestionBankFilters topics={topics} total={312} shown={312} {...props} value={value} onChange={setValue} />
  );
};
export const FiltrosEmRepouso: Story = { name: "Filtros em repouso", render: () => <FilterBar /> };
export const FiltrosAtivos: Story = {
  name: "Filtros ativos",
  render: () => <FilterBar shown={37} start={{ topic: "rep", result: "wrong", status: "all" }} />,
};
export const FiltrosCarregando: Story = { name: "Filtros carregando", render: () => <FilterBar loading /> };
export const FiltrosDesabilitados: Story = { name: "Filtros desabilitados", render: () => <FilterBar disabled /> };

/* ---- Tela inteira: filtros, lista e paginação ---- */
interface Q {
  id: number;
  topic: string;
  result: BankResult;
  status: "active" | "voided" | "contested" | "archived";
}
const all: Q[] = Array.from({ length: 52 }, (_, i) => ({
  id: i,
  topic: topics[i % 4].value,
  result: (["wrong", "guess", "right", "never", "right", "dontknow"] as const)[i % 6],
  status: i % 13 === 0 ? "contested" : i % 17 === 0 ? "archived" : i % 23 === 0 ? "voided" : "active",
}));
const PAGE = 8;

type Phase = "ready" | "loading" | "error" | "empty";

function Bank({ phase = "ready" }: { phase?: Phase }) {
  const [filters, setFilters] = useState(emptyBankFilters);
  const [page, setPage] = useState(1);
  const items = useMemo(() => (phase === "empty" ? [] : all), [phase]);
  const filtered = items.filter(
    (q) =>
      (filters.topic === "all" || q.topic === filters.topic) &&
      (filters.result === "all" || (filters.result as BankResultFilter) === q.result || (filters.result === "wrong" && q.result === "dontknow")) &&
      (filters.status === "all" || (filters.status as BankStatusFilter) === q.status),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pageCount);
  const shown = filtered.slice((current - 1) * PAGE, current * PAGE);
  const set = (v: QuestionBankFilterValue) => {
    setFilters(v);
    setPage(1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: "var(--width-content)" }}>
      <QuestionBankFilters
        topics={topics}
        value={filters}
        onChange={set}
        total={items.length}
        shown={filtered.length}
        loading={phase === "loading"}
        disabled={phase === "error" || phase === "empty"}
      />
      {phase === "loading" ? (
        <ul style={{ margin: 0, padding: 0 }} aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <QuestionBankRow key={i} skeleton topic="" prompt="" result="never" />
          ))}
        </ul>
      ) : phase === "error" ? (
        <EmptyState tone="danger" icon={<SearchX size={28} />} title="Não foi possível carregar as Perguntas" action={<Button variant="secondary">Tentar de novo</Button>}>
          Verifique a conexão e tente de novo.
        </EmptyState>
      ) : phase === "empty" ? (
        <EmptyState icon={<Layers size={28} />} title="Nenhuma Pergunta ainda" action={<Button>Gerar Rodada</Button>}>
          As Perguntas aparecem aqui depois da primeira Rodada.
        </EmptyState>
      ) : shown.length === 0 ? (
        <EmptyState size="compact" icon={<SearchX size={28} />} title="Nenhuma Pergunta com esses filtros" action={<Button variant="secondary" onClick={() => set(emptyBankFilters)}>Limpar filtros</Button>}>
          Tente outra combinação.
        </EmptyState>
      ) : (
        <>
          <ul style={{ margin: 0, padding: 0 }}>
            {shown.map((q) => (
              <QuestionBankRow
                key={q.id}
                topic={topics.find((t) => t.value === q.topic)!.label}
                prompt={q.id % 3 === 0 ? longPrompt : "Qual é o objetivo de um health check em um balanceador de carga?"}
                result={q.result}
                status={q.status}
                alternatives={alternatives}
                history={q.result === "never" ? [] : history.slice(0, 3)}
                references={q.id % 4 === 0 ? [] : [{ source: "Guia de alta disponibilidade.pdf", location: "p. 14" }]}
              />
            ))}
          </ul>
          <Pagination page={current} pageCount={pageCount} onPageChange={setPage} total={filtered.length} pageSize={PAGE} aria-label="Páginas do banco de Perguntas" />
        </>
      )}
    </div>
  );
}

export const BancoCompleto: Story = { name: "Banco completo", render: () => <Bank /> };
export const BancoCarregando: Story = { name: "Banco carregando", render: () => <Bank phase="loading" /> };
export const BancoComErro: Story = { name: "Banco, erro ao carregar", render: () => <Bank phase="error" /> };
export const BancoVazio: Story = { name: "Banco vazio", render: () => <Bank phase="empty" /> };
export const SemResultados: Story = {
  name: "Nenhum resultado com filtros",
  render: () => {
    const Empty = () => {
      const [f, setF] = useState<QuestionBankFilterValue>({ topic: "dns", result: "never", status: "voided" });
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: "var(--width-content)" }}>
          <QuestionBankFilters topics={topics} value={f} onChange={setF} total={312} shown={0} />
          <EmptyState size="compact" icon={<SearchX size={28} />} title="Nenhuma Pergunta com esses filtros" action={<Button variant="secondary" onClick={() => setF(emptyBankFilters)}>Limpar filtros</Button>}>
            Tente outra combinação.
          </EmptyState>
        </div>
      );
    };
    return <Empty />;
  },
};
