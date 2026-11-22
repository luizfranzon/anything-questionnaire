import type { Meta, StoryObj } from "@storybook/react-vite";
import { TopicProposalScreen } from "./TopicProposalScreen";

const topics = [
  { id: "1", name: "VPC, sub-redes e roteamento" },
  { id: "2", name: "Grupos de segurança e NACLs" },
  { id: "3", name: "Replicação e failover" },
  { id: "4", name: "Backup e restauração" },
  { id: "5", name: "Armazenamento de objetos (S3)" },
  { id: "6", name: "Volumes de bloco e desempenho de disco" },
  { id: "7", name: "Balanceamento de carga e Auto Scaling" },
  { id: "8", name: "Modelos de custo, reservas e Savings Plans" },
  {
    id: "9",
    name: "Arquiteturas orientadas a eventos com filas, tópicos e funções sem servidor para desacoplar cargas de trabalho",
  },
  { id: "10", name: "Observabilidade e auditoria" },
  { id: "11", name: "Conformidade e governança de contas" },
  { id: "12", name: "Migração de cargas de trabalho legadas" },
];

const meta = {
  title: "Telas/Proposta de Tópicos",
  component: TopicProposalScreen,
  parameters: { layout: "fullscreen" },
  args: { studyName: "Certificação AWS Solutions Architect", phase: "ready", topics },
} satisfies Meta<typeof TopicProposalScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ParaRevisar: Story = {};
export const Gerando: Story = { args: { phase: "generating", topics: [] } };
export const NovaTentativaAutomatica: Story = { args: { phase: "retrying", topics: [] } };
export const Falhou: Story = { args: { phase: "failed", topics: [] } };
export const PropostaIncremental: Story = {
  name: "Proposta incremental (Fonte nova)",
  args: { incremental: true, topics: topics.slice(0, 3) },
};
export const Aprovando: Story = { args: { saving: true } };
export const ErroAoAprovar: Story = {
  args: { saveError: "Não foi possível gravar os Tópicos. A proposta continua aqui; tente aprovar de novo." },
};
export const UmTopico: Story = { args: { topics: topics.slice(0, 1) } };
export const SemNenhumTopico: Story = { args: { topics: [] } };
