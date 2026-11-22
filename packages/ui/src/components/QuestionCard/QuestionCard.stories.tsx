import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { QuestionCard, type QuestionCardProps } from "./QuestionCard";

const alternatives = [
  { id: "a", text: "Replica leituras em todas as zonas de disponibilidade" },
  { id: "b", text: "Mantém uma réplica síncrona em outra zona e faz failover automático" },
  { id: "c", text: "Cria um snapshot diário e o restaura manualmente em caso de falha" },
  { id: "d", text: "Distribui as escritas entre duas instâncias primárias" },
];

const base: QuestionCardProps = {
  topic: "Alta disponibilidade e recuperação de desastres",
  position: { current: 8, total: 20 },
  prompt: "Um banco de dados relacional precisa sobreviver à queda de uma zona de disponibilidade sem perder transações confirmadas. Qual configuração atende a esse requisito?",
  alternatives,
};

const meta = {
  title: "Componentes/QuestionCard",
  component: QuestionCard,
  args: base,
} satisfies Meta<typeof QuestionCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "Padrão" };
export const Marcada: Story = { args: { selectedId: "b" } };
export const Gravando: Story = { args: { selectedId: "b", submitting: true } };
export const ErroAoGravar: Story = { name: "Erro ao gravar", args: { selectedId: "b", submitError: true } };
export const Revisao: Story = { name: "Revisão", args: { review: true } };

export const Acerto: Story = { args: { answer: { pickedId: "b", correctId: "b" } } };
export const Erro: Story = { args: { answer: { pickedId: "c", correctId: "b" } } };
export const NaoSei: Story = { name: "Não sei", args: { answer: { pickedId: null, correctId: "b" } } };
export const SimuladoEnviada: Story = {
  name: "Simulado, enviada",
  args: { mode: "mock", answer: { pickedId: "c" } },
};

export const Carregando: Story = { args: { status: "loading" } };
export const NaoCarregou: Story = { name: "Não carregou", args: { status: "error" } };
export const Anulada: Story = { args: { status: "voided", selectedId: "b" } };

export const TextoLongo: Story = {
  name: "Texto longo",
  args: {
    topic: "Replicação multirregional, consistência eventual e estratégias de failover em bancos distribuídos",
    review: true,
    prompt:
      "Uma aplicação de pagamentos atende clientes em três continentes e grava cada transação em um banco distribuído. A equipe exige que nenhuma transação confirmada seja perdida se uma região inteira ficar indisponível, mas também precisa manter a latência de escrita abaixo de 200 ms para 95% das requisições, e o orçamento não permite uma quarta região. Considerando essas restrições em conjunto, qual arquitetura de replicação é a mais adequada?",
    alternatives: [
      { id: "a", text: "Mantém uma cópia síncrona em outra região e promove a réplica automaticamente quando a região primária fica indisponível, aceitando uma latência de escrita maior em troca de perda de dados zero" },
      { id: "b", text: "Replicação assíncrona entre as três regiões" },
      { id: "c", text: "Snapshot diário com restauração manual" },
      { id: "d", text: "Escrita multi-primária com resolução de conflitos por último escritor" },
    ],
    selectedId: "a",
  },
};

/** Fluxo real: marcar (ou teclas 1 a 4), responder e ver a correção. */
export const Fluxo: Story = {
  render: (args) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [answer, setAnswer] = useState<QuestionCardProps["answer"]>();
    return (
      <QuestionCard
        {...args}
        selectedId={selectedId}
        onSelect={setSelectedId}
        answer={answer}
        onSubmit={() => setAnswer({ pickedId: selectedId, correctId: "b" })}
        onDontKnow={() => setAnswer({ pickedId: null, correctId: "b" })}
      />
    );
  },
};
