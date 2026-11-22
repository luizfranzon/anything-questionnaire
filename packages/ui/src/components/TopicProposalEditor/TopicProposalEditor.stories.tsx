import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TopicProposalEditor, type EditableTopic, type TopicProposalEditorProps } from "./TopicProposalEditor";

const proposal: EditableTopic[] = [
  { id: "t1", name: "Replicação e failover" },
  { id: "t2", name: "Balanceamento de carga" },
  { id: "t3", name: "Backup e restauração" },
  { id: "t4", name: "DNS e roteamento" },
];
const managed: EditableTopic[] = [
  { id: "t1", name: "Replicação e failover", questionCount: 18 },
  { id: "t2", name: "Balanceamento de carga", questionCount: 25 },
  { id: "t3", name: "Backup e restauração", questionCount: 10 },
  { id: "t4", name: "DNS e roteamento", questionCount: 12, archived: true },
];

const noop = () => {};

const meta = {
  title: "Componentes/TopicProposalEditor",
  component: TopicProposalEditor,
  args: { mode: "proposal", topics: proposal, onRename: noop, onMerge: noop, onAdd: noop, onRemove: noop, onArchive: noop, onReactivate: noop, onApprove: noop },
} satisfies Meta<typeof TopicProposalEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Estados reais: renomear, juntar, apagar/arquivar e adicionar mexem na lista. */
function Live(args: TopicProposalEditorProps) {
  const [topics, setTopics] = useState(args.topics);
  return (
    <TopicProposalEditor
      {...args}
      topics={topics}
      onRename={(id, name) => setTopics((l) => l.map((t) => (t.id === id ? { ...t, name } : t)))}
      onMerge={(ids) => setTopics((l) => l.filter((t) => !ids.includes(t.id)))}
      onAdd={(name) => setTopics((l) => [...l, { id: `n${l.length}${name}`, name }])}
      onRemove={(id) => setTopics((l) => l.filter((t) => t.id !== id))}
      onArchive={(id) => setTopics((l) => l.map((t) => (t.id === id ? { ...t, archived: true } : t)))}
      onReactivate={(id) => setTopics((l) => l.map((t) => (t.id === id ? { ...t, archived: false } : t)))}
    />
  );
}

export const Proposta: Story = { render: (args) => <Live {...args} /> };
export const Gerenciar: Story = { name: "Tópicos do Estudo", args: { mode: "managed", topics: managed }, render: (args) => <Live {...args} /> };
export const Vazia: Story = { args: { topics: [] }, render: (args) => <Live {...args} /> };
export const NomeLongo: Story = {
  name: "Nome longo",
  args: {
    topics: [{ id: "l1", name: "Estratégias de recuperação de desastres entre regiões com requisitos de RPO e RTO distintos" }, ...proposal],
  },
  render: (args) => <Live {...args} />,
};
export const ErroAoGravar: Story = { name: "Erro ao gravar", args: { error: "O servidor não respondeu. Seus Tópicos continuam como estavam." } };
export const Gravando: Story = { args: { status: "saving" } };
export const Carregando: Story = { args: { status: "loading" } };
export const GerenciarGravando: Story = { name: "Tópicos do Estudo gravando", args: { mode: "managed", topics: managed, status: "saving" } };
