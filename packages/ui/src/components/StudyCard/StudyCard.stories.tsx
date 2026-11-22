import type { Meta, StoryObj } from "@storybook/react-vite";
import { StudyCard } from "./StudyCard";

const meta = {
  title: "Componentes/StudyCard",
  component: StudyCard,
  args: {
    name: "Arquitetura de redes",
    goal: "Passar na certificação de arquiteto de soluções, com foco em alta disponibilidade e recuperação de desastres.",
    topicCount: 6,
    sourceCount: 4,
    lastActivity: "22/11",
    onOpen: () => {},
    onEdit: () => {},
    onDelete: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "var(--width-reading)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StudyCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "Padrão" };
export const Hover: Story = { args: { forceState: "hover" } };
export const Foco: Story = { args: { forceState: "focus" } };
export const RodadaEmAndamento: Story = { name: "Com Rodada em andamento", args: { roundInProgress: { done: 8, total: 20 } } };
export const SemTopicos: Story = { name: "Sem Tópicos aprovados", args: { topicCount: 0, sourceCount: 0, lastActivity: undefined } };
export const SemAtividade: Story = { name: "Sem atividade", args: { lastActivity: undefined, sourceCount: 1, topicCount: 1 } };
export const ObjetivoLongo: Story = {
  name: "Nome e Objetivo longos",
  args: {
    name: "Preparação para a certificação de arquiteto de soluções em nuvem, com várias regiões",
    goal: "Passar na certificação de arquiteto de soluções, com foco em alta disponibilidade, recuperação de desastres, custos, segurança de rede, observabilidade e migração de cargas de trabalho legadas para a nuvem sem parada.",
    roundInProgress: { done: 18, total: 20 },
  },
};
export const SoAbrir: Story = { name: "Sem editar e excluir", args: { onEdit: undefined, onDelete: undefined } };
export const Carregando: Story = { args: { status: "loading" } };

export const Lista: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 16 }}>
      <StudyCard {...args} roundInProgress={{ done: 8, total: 20 }} />
      <StudyCard {...args} name="Direito administrativo" goal="Concurso de analista, edital de 2027." topicCount={9} sourceCount={2} lastActivity="19/11" />
      <StudyCard {...args} name="Inglês técnico" goal="Ler documentação sem tradutor." topicCount={0} sourceCount={0} lastActivity={undefined} />
    </div>
  ),
};
