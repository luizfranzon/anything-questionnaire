import type { Meta, StoryObj } from "@storybook/react-vite";
import { RoundResultScreen } from "./RoundResultScreen";

const topics = [
  { name: "Replicação e failover", correct: 2, total: 5 },
  { name: "Backup e restauração", correct: 3, total: 4 },
  { name: "VPC, sub-redes e roteamento", correct: 4, total: 5 },
  { name: "Armazenamento de objetos (S3)", correct: 5, total: 6 },
];

const manyTopics = Array.from({ length: 12 }, (_, i) => ({
  name:
    i === 3
      ? "Arquiteturas orientadas a eventos com filas, tópicos e funções sem servidor para desacoplar cargas de trabalho"
      : `Tópico de exemplo ${i + 1}`,
  correct: (i * 3) % 5,
  total: 5,
}));

const meta = {
  title: "Telas/Resultado da Rodada",
  component: RoundResultScreen,
  parameters: { layout: "fullscreen" },
  args: { studyName: "Certificação AWS Solutions Architect", correct: 14, total: 20, mode: "study", date: "22/11", topics },
} satisfies Meta<typeof RoundResultScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Estudo: Story = {};
export const Simulado: Story = { args: { mode: "mock", correct: 31, total: 40, dontKnow: 4 } };
export const ComNaoSei: Story = { args: { dontKnow: 3 } };
export const TudoCerto: Story = {
  args: { correct: 20, total: 20, topics: topics.map((t) => ({ ...t, correct: t.total })) },
};
export const TudoErrado: Story = {
  args: { correct: 0, total: 20, topics: topics.map((t) => ({ ...t, correct: 0 })) },
};
export const UmaPergunta: Story = { args: { correct: 1, total: 1, topics: [topics[0]] } };
export const MuitosTopicos: Story = { args: { correct: 31, total: 60, topics: manyTopics } };
export const SemQuebraPorTopico: Story = { args: { topics: undefined } };
export const Carregando: Story = { args: { status: "loading" } };
export const NaoCalculou: Story = { args: { status: "error" } };
