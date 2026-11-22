import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReviewList, type ReviewItem } from "./ReviewList";

const alts = (a: string, b: string, c: string, d: string) => [
  { id: "A", text: a },
  { id: "B", text: b },
  { id: "C", text: c },
  { id: "D", text: d },
];

const failoverAlts = alts(
  "Réplicas de leitura em outra região",
  "Réplica síncrona em outra zona com failover automático",
  "Snapshot diário com restauração manual",
  "Duas instâncias primárias aceitando escrita",
);

const explanations = (picked: string | null) => [
  {
    letter: "B",
    correct: true,
    picked: picked === "B",
    why: "Uma réplica síncrona confirma cada transação nas duas cópias antes de responder, então nenhuma transação confirmada se perde.",
  },
  { letter: "A", picked: picked === "A", why: "Réplicas de leitura são assíncronas e não participam do failover de escrita." },
  { letter: "C", picked: picked === "C", why: "Um snapshot diário deixa até 24 horas de transações sem proteção." },
  { letter: "D", picked: picked === "D", why: "Duas primárias exigem resolução de conflitos e não garantem a transação nas duas." },
];

const refs = [{ source: "Guia de alta disponibilidade.pdf", location: "p. 14" }];

const items: ReviewItem[] = [
  {
    id: "1",
    position: 1,
    topic: "Replicação e failover",
    prompt: "Qual configuração garante que nenhuma transação confirmada seja perdida se a zona primária cair?",
    alternatives: failoverAlts,
    pickedId: "B",
    correctId: "B",
    confidence: "certeza",
    explanations: explanations("B"),
    references: refs,
  },
  {
    id: "2",
    position: 2,
    topic: "Backup e restauração",
    prompt: "Qual é o principal risco de depender só de snapshots diários?",
    alternatives: failoverAlts,
    pickedId: "C",
    correctId: "B",
    confidence: "duvida",
    explanations: explanations("C"),
    references: refs,
    contestation: { status: "pending" },
  },
  {
    id: "3",
    position: 3,
    topic: "Balanceamento de carga",
    prompt: "O que acontece com as conexões abertas quando o balanceador remove uma instância não saudável?",
    alternatives: failoverAlts,
    pickedId: null,
    correctId: "B",
    explanations: explanations(null),
  },
  {
    id: "4",
    position: 4,
    topic: "DNS e roteamento",
    prompt: "Qual registro DNS aponta um nome para outro nome em vez de um endereço IP?",
    alternatives: failoverAlts,
    pickedId: "A",
    correctId: "A",
    confidence: "duvida",
    explanations: explanations("A"),
    divergence: "A Fonte descreve o comportamento do registro ALIAS, não do CNAME.",
  },
  {
    id: "5",
    position: 5,
    topic: "Replicação e failover",
    prompt: "Qual a consequência de promover uma réplica assíncrona durante um failover?",
    alternatives: failoverAlts,
    pickedId: "D",
    correctId: "B",
    explanations: [],
    voided: true,
    contestation: { status: "voided" },
  },
];

const meta = {
  title: "Componentes/ReviewList",
  component: ReviewList,
  args: { items },
} satisfies Meta<typeof ReviewList>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Tudo recolhido: certa, errada com Confiança, "Não sei", certa e anulada. */
export const Recolhida: Story = {};

/** Uma certa e uma errada abertas. */
export const Abertas: Story = { args: { defaultExpanded: ["1", "2"] } };

/** Contestação em análise e Pergunta anulada. */
export const ComContestacao: Story = { name: "Com Contestação", args: { defaultExpanded: ["5"] } };

/** Aviso de divergência com a Fonte. */
export const ComDivergencia: Story = { name: "Com divergência da Fonte", args: { defaultExpanded: ["4"] } };

/** Rodada encerrada antes do fim: só as Perguntas respondidas. */
export const RodadaEncerrada: Story = { args: { items: items.slice(0, 3), roundTotal: 10 } };

/** Tudo certo: a aba "Erradas" fica vazia. */
export const SoAcertos: Story = {
  name: "Só acertos (aba Erradas vazia)",
  args: { items: [items[0], items[3]] },
};

export const Carregando: Story = { args: { status: "loading" } };

export const EnunciadoLongo: Story = {
  name: "Enunciado longo",
  args: {
    items: [
      {
        ...items[0],
        prompt:
          "Uma empresa opera um banco de dados relacional em uma única zona de disponibilidade e precisa garantir que, mesmo com a queda total dessa zona, nenhuma transação já confirmada ao cliente seja perdida e a aplicação volte a escrever em menos de dois minutos. Qual configuração atende?",
        topic: "Estratégias de recuperação de desastres entre regiões com RPO e RTO distintos",
      },
    ],
  },
};
