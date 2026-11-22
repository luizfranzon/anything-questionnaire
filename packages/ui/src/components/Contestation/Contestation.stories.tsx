import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button/Button";
import { DialogPanel } from "../Dialog/Dialog";
import { InlineAlert } from "../InlineAlert/InlineAlert";
import { Textarea } from "../Textarea/Textarea";
import {
  CONTESTATION_DESCRIPTION,
  ContestationActions,
  ContestationForm,
  ContestedQuestion,
} from "./ContestationForm";
import { ContestationStatus } from "./ContestationStatus";

const prompt = "Qual configuração garante que nenhuma transação confirmada seja perdida se a zona primária cair?";
const argument = "A Alternativa C também protege se o snapshot for contínuo, como descreve a documentação do provedor.";
const justification =
  "A documentação citada trata snapshots contínuos como replicação assíncrona, que pode perder as últimas transações. O Gabarito B continua sendo o único que garante zero perda.";

const meta = {
  title: "Componentes/Contestation",
  component: ContestationStatus,
  args: { status: "reviewing" },
} satisfies Meta<typeof ContestationStatus>;
export default meta;
type Story = StoryObj<typeof meta>;

// Situação
export const EmAnalise: Story = { name: "Situação: em análise", args: { status: "reviewing", argument } };
export const Mantida: Story = { name: "Situação: mantida", args: { status: "kept", justification, argument, date: "22/11" } };
export const Corrigida: Story = {
  name: "Situação: corrigida",
  args: { status: "corrected", justification: "O Gabarito passa a ser a Alternativa C, conforme a página 22 da Fonte.", date: "22/11" },
};
export const Anulada: Story = {
  name: "Situação: anulada",
  args: { status: "voided", justification: "Duas Alternativas satisfazem o enunciado e a Fonte não decide entre elas.", date: "22/11" },
};
export const Situacoes: Story = {
  name: "Situações lado a lado",
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <ContestationStatus status="reviewing" />
      <ContestationStatus status="kept" justification={justification} />
      <ContestationStatus status="corrected" justification="O Gabarito passa a ser a Alternativa C." />
      <ContestationStatus status="voided" justification="Duas Alternativas satisfazem o enunciado." />
    </div>
  ),
};

// Formulário
/** Abre de verdade. Cancelar, Esc, clique fora e X fecham; "Contestar" só habilita com texto. */
export const Formulario: Story = {
  name: "Formulário (interativo)",
  render: () => {
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Contestar
        </Button>
        <ContestationForm
          open={open}
          onClose={() => setOpen(false)}
          prompt={prompt}
          gabarito="B"
          submitting={submitting}
          onSubmit={() => {
            setSubmitting(true);
            setTimeout(() => {
              setSubmitting(false);
              setOpen(false);
            }, 1200);
          }}
        />
      </>
    );
  },
};

function StaticForm({ text = "", submitting = false, error = false }: { text?: string; submitting?: boolean; error?: boolean }) {
  return (
    <DialogPanel
      size="sm"
      title="Contestar o Gabarito"
      description={CONTESTATION_DESCRIPTION}
      onClose={() => {}}
      busy={submitting}
      footer={<ContestationActions submitting={submitting} empty={text.trim().length === 0} />}
    >
      <ContestedQuestion prompt={prompt} gabarito="B" />
      <Textarea
        label="Seu argumento"
        placeholder="Ex.: a Alternativa C também está certa porque…"
        minRows={4}
        maxLength={1000}
        value={text}
        readOnly
        disabled={submitting}
      />
      {error && <InlineAlert tone="danger">Não foi possível enviar a Contestação. Tente de novo.</InlineAlert>}
    </DialogPanel>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p style={{ margin: "0 0 var(--space-2)", font: "600 var(--text-small) var(--font-sans)", color: "var(--color-text-muted)" }}>
        {label}
      </p>
      {children}
    </div>
  );
}

/** Estados do formulário lado a lado, sem a janela modal. */
export const EstadosDoFormulario: Story = {
  name: "Formulário, estados",
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap", alignItems: "start" }}>
      <Labeled label="Vazio (Contestar desabilitado)">
        <StaticForm />
      </Labeled>
      <Labeled label="Preenchido">
        <StaticForm text="A Alternativa C também está certa porque o snapshot contínuo não perde transações." />
      </Labeled>
      <Labeled label="Enviando">
        <StaticForm text="A Alternativa C também está certa." submitting />
      </Labeled>
      <Labeled label="Erro ao gravar">
        <StaticForm text="A Alternativa C também está certa." error />
      </Labeled>
    </div>
  ),
};
