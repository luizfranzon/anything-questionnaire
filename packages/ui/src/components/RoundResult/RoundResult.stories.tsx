import type { Meta, StoryObj } from "@storybook/react-vite";
import { RoundResult } from "./RoundResult";

const topics = [
  { name: "Replicação e failover", correct: 5, total: 6 },
  { name: "Balanceamento de carga", correct: 4, total: 5 },
  { name: "Backup e restauração", correct: 3, total: 5 },
  { name: "DNS e roteamento", correct: 2, total: 4 },
];

const meta = {
  title: "Componentes/RoundResult",
  component: RoundResult,
  args: {
    correct: 14,
    total: 20,
    dontKnow: 2,
    mode: "study",
    date: "22/11",
    topics,
    onNewRound: () => {},
  },
} satisfies Meta<typeof RoundResult>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ModoEstudo: Story = { name: "Modo estudo" };
export const Simulado: Story = { args: { mode: "mock", onReview: () => {} } };
export const SemNaoSei: Story = { name: "Sem “Não sei”", args: { dontKnow: 0 } };
export const AcertouTudo: Story = { name: "Todas certas", args: { correct: 20, dontKnow: 0, topics: topics.map((t) => ({ ...t, correct: t.total })) } };
export const ErrouTudo: Story = { name: "Todas erradas", args: { correct: 0, dontKnow: 0, topics: topics.map((t) => ({ ...t, correct: 0 })) } };
export const UmaPergunta: Story = { name: "Uma Pergunta só", args: { correct: 1, total: 1, dontKnow: 0, topics: [{ name: "Replicação e failover", correct: 1, total: 1 }] } };
export const SemTopicos: Story = { name: "Sem quebra por Tópico", args: { topics: [] } };
export const TopicoComNomeLongo: Story = {
  name: "Tópico com nome longo",
  args: {
    topics: [
      { name: "Estratégias de recuperação de desastres entre regiões com requisitos de RPO e RTO distintos", correct: 1, total: 3 },
      ...topics,
    ],
  },
};
export const Carregando: Story = { args: { status: "loading", mode: "mock" } };
export const Erro: Story = { name: "Não calculou", args: { status: "error", onRetry: () => {} } };
