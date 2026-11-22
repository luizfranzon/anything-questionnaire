import type { Meta, StoryObj } from "@storybook/react-vite";
import { RoundCreateScreen, type RoundTopic } from "./RoundCreateScreen";

const topics: RoundTopic[] = [
  { id: "t1", name: "Replicação e failover" },
  { id: "t2", name: "Backup e restauração" },
  { id: "t3", name: "VPC, sub-redes e roteamento" },
  {
    id: "t4",
    name: "Arquiteturas orientadas a eventos com filas, tópicos e funções sem servidor para desacoplar cargas de trabalho",
  },
  { id: "t5", name: "Armazenamento de objetos (S3)" },
  { id: "t6", name: "Observabilidade e auditoria", hint: "Nunca perguntado" },
];

const meta = {
  title: "Telas/Criação de Rodada",
  component: RoundCreateScreen,
  parameters: { layout: "fullscreen" },
  args: { studyName: "Certificação AWS Solutions Architect", topics, dueReviews: 12 },
} satisfies Meta<typeof RoundCreateScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Formulario: Story = {};
export const ComRodadaEmAndamento: Story = { args: { roundInProgress: { done: 8, total: 20 } } };
export const SimuladoComTopicosEscolhidos: Story = {
  args: { initial: { count: 40, mode: "mock", selected: ["t1", "t2"] } },
};
export const QuantidadeInvalida: Story = { args: { initial: { count: 150, mode: "study", selected: [] }, showErrors: true } };
export const SemRevisoesVencidas: Story = { args: { dueReviews: 0 } };
export const UmTopicoSo: Story = { args: { topics: topics.slice(0, 1) } };
export const SemTopicosAtivos: Story = { args: { topics: [] } };
export const Enviando: Story = { args: { submitting: true } };
export const ErroAoCriar: Story = {
  args: { submitError: "Não foi possível enfileirar a geração. Tente de novo; os valores foram mantidos." },
};

/** Tela de progresso: só avança quando todas as Perguntas estão prontas e verificadas. */
export const GerandoInicio: Story = { args: { phase: "generating", generated: { done: 0, total: 20 } } };
export const Gerando: Story = { args: { phase: "generating", generated: { done: 12, total: 20 } } };
export const NovaTentativaAutomatica: Story = { args: { phase: "retrying", generated: { done: 12, total: 20 } } };
export const Falhou: Story = { args: { phase: "failed" } };
export const Pronta: Story = { args: { phase: "ready", generated: { done: 20, total: 20 } } };
