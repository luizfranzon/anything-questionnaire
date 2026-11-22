import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SourceAddForm, type SourceAddFormProps, type SourceAddValue } from "./SourceAddForm";
import type { UploadItem } from "../FileDropzone/FileDropzone";

const files: SourceAddFormProps["files"] = { files: [], onAdd: () => {}, onRemove: () => {}, onRetry: () => {} };

const meta = {
  title: "Componentes/SourceAddForm",
  component: SourceAddForm,
  args: { onSubmit: () => {}, files },
} satisfies Meta<typeof SourceAddForm>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Estudo sem Fontes: o formulário já aparece aberto. Envia por 1,2s; a primeira tentativa falha, a segunda conclui. */
export const Texto: Story = {
  render: (args) => {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string>();
    const [attempts, setAttempts] = useState(0);
    const [added, setAdded] = useState<SourceAddValue>();
    const submit = (v: SourceAddValue) => {
      setError(undefined);
      setSubmitting(true);
      setTimeout(() => {
        setSubmitting(false);
        if (attempts === 0) {
          setAttempts(1);
          setError("O servidor não respondeu. O que você digitou continua aqui.");
        } else setAdded(v);
      }, 1200);
    };
    return (
      <>
        <SourceAddForm {...args} submitting={submitting} submitError={error} onSubmit={submit} />
        {added && <p style={{ color: "var(--color-text-muted)" }}>Adicionada: {added.kind}</p>}
      </>
    );
  },
};

export const Site: Story = { args: { defaultKind: "site" } };
export const YouTube: Story = { args: { defaultKind: "youtube" } };
export const Arquivo: Story = { args: { defaultKind: "file" } };

const uploads: UploadItem[] = [
  { id: "1", name: "Guia de alta disponibilidade.pdf", size: 4_200_000, status: "done" },
  { id: "2", name: "Resumo do módulo 2.docx", size: 380_000, status: "uploading", progress: 55 },
  { id: "3", name: "Prova-2023-escaneada.pdf", size: 19_000_000, status: "error", error: "PDF protegido por senha" },
];
export const ArquivoComEnvios: Story = { name: "Arquivo, com envios", args: { defaultKind: "file", files: { ...files, files: uploads } } };

export const Enviando: Story = { args: { submitting: true } };
export const ErroAoEnviar: Story = { name: "Erro ao enviar", args: { submitError: "O servidor não respondeu. Tente de novo." } };

/** Estudo que já tem Fontes: recolhido atrás do botão. */
export const Recolhido: Story = { args: { collapsible: true } };
export const RecolhidoAberto: Story = { name: "Recolhível, aberto", args: { collapsible: true, defaultOpen: true } };
