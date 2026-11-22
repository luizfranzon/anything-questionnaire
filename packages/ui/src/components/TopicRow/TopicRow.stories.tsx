import type { Meta, StoryObj } from "@storybook/react-vite";
import { TopicRow } from "./TopicRow";

const meta = {
  title: "Componentes/TopicRow",
  component: TopicRow,
  args: { name: "Replicação e failover", performance: 62, trend: "up", delta: 12, answers: 18 },
  decorators: [
    (Story) => (
      <ul style={{ margin: 0, padding: 0, maxWidth: "var(--width-content)" }}>
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof TopicRow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Subindo: Story = {};
export const Caindo: Story = { args: { performance: 34, trend: "down", delta: -9 } };
export const Estavel: Story = { name: "Estável", args: { performance: 78, trend: "flat", delta: undefined } };
export const NuncaPerguntado: Story = { name: "Nunca perguntado", args: { performance: null, trend: "unknown", delta: undefined, answers: 0 } };
export const UmaResposta: Story = { name: "Uma Resposta", args: { performance: 100, trend: "unknown", delta: undefined, answers: 1 } };
export const Arquivado: Story = { args: { archived: true } };
export const NomeLongo: Story = {
  name: "Nome longo",
  args: { name: "Estratégias de recuperação de desastres entre regiões com requisitos de RPO e RTO distintos", archived: true },
};
export const Carregando: Story = { args: { status: "loading" } };

/** A lista na página do Estudo: do mais fraco ao mais forte. */
export const Lista: Story = {
  render: () => (
    <>
      <TopicRow name="DNS e roteamento" performance={34} trend="down" delta={-9} answers={12} />
      <TopicRow name="Backup e restauração" performance={48} trend="flat" answers={10} />
      <TopicRow name="Replicação e failover" performance={62} trend="up" delta={12} answers={18} />
      <TopicRow name="Balanceamento de carga" performance={88} trend="up" delta={4} answers={25} />
      <TopicRow name="Observabilidade" performance={null} trend="unknown" answers={0} />
      <TopicRow name="Segurança de rede" performance={55} trend="unknown" answers={3} archived />
    </>
  ),
};
export const ListaCarregando: Story = {
  name: "Lista carregando",
  render: () => (
    <>
      <TopicRow name="" performance={0} trend="unknown" answers={0} status="loading" />
      <TopicRow name="" performance={0} trend="unknown" answers={0} status="loading" />
      <TopicRow name="" performance={0} trend="unknown" answers={0} status="loading" />
    </>
  ),
};
