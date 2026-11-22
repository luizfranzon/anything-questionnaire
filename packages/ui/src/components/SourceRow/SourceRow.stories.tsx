import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SourceRow, type RemoveChoice } from "./SourceRow";
import type { IngestionStep } from "../IngestionProgress/IngestionProgress";

const extracting: IngestionStep[] = [
  { id: "download", label: "Baixando", status: "done" },
  { id: "extract", label: "Extraindo", status: "active", progress: 40 },
  { id: "classify", label: "Classificando", status: "pending" },
];

const meta = {
  title: "Componentes/SourceRow",
  component: SourceRow,
  args: {
    kind: "pdf",
    name: "Guia de alta disponibilidade.pdf",
    status: "ready",
    excerptCount: 48,
    extent: "12 páginas",
    onRemove: () => {},
  },
  decorators: [
    (Story) => (
      <ul style={{ margin: 0, padding: 0, maxWidth: "var(--width-content)" }}>
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof SourceRow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Pronta: Story = {};
export const Hover: Story = { args: { forceState: "hover" } };
export const UmTrecho: Story = { name: "Um Trecho", args: { kind: "text", name: "Anotações da aula 3", excerptCount: 1, extent: undefined } };
export const Processando: Story = { args: { status: "processing", steps: extracting, excerptCount: undefined, extent: undefined } };
export const ErroSite: Story = {
  name: "Erro: site bloqueado",
  args: {
    kind: "site",
    name: "https://intranet.exemplo.com.br/wiki/redes/alta-disponibilidade",
    status: "failed",
    error: "A página exige login ou bloqueou o download",
    hint: "Cole o texto da página como Fonte de texto.",
    onRetry: () => {},
  },
};
export const ErroYoutube: Story = {
  name: "Erro: vídeo sem legenda",
  args: { kind: "youtube", name: "Alta disponibilidade em 40 minutos", status: "failed", error: "O vídeo não tem legenda", hint: "Não dá para gerar Trechos sem legenda. Use outra Fonte." },
};
export const ErroPdf: Story = {
  name: "Erro: arquivo ilegível",
  args: { name: "Prova-2023-escaneada.pdf", status: "failed", error: "Não foi possível ler o PDF", hint: "O arquivo está protegido por senha.", onRetry: () => {} },
};
export const Youtube: Story = { args: { kind: "youtube", name: "Alta disponibilidade em 40 minutos", excerptCount: 31, extent: "42 min" } };
export const NomeLongo: Story = {
  name: "Nome muito longo",
  args: {
    kind: "site",
    name: "https://docs.exemplo.com.br/arquitetura/alta-disponibilidade/balanceamento-de-carga/estrategias-de-failover-e-replicacao-entre-regioes",
    excerptCount: 22,
    extent: undefined,
  },
};
export const Carregando: Story = { args: { status: "loading" } };
export const SemRemover: Story = { name: "Sem remover", args: { onRemove: undefined } };
export const Removendo: Story = { args: { removing: true } };
export const ErroAoRemover: Story = { name: "Erro ao remover", args: { removeError: "O arquivo guardado não pôde ser apagado. Tente de novo.", questionCount: 12 } };

/** Remover (ticket 15): o diálogo pergunta o que fazer com as Perguntas (manter é o padrão). A primeira tentativa falha, a segunda conclui. */
export const RemoverComPerguntas: Story = {
  name: "Remover, com Perguntas",
  render: (args) => {
    const [state, setState] = useState<"idle" | "removing" | "gone">("idle");
    const [error, setError] = useState<string>();
    const [attempts, setAttempts] = useState(0);
    const [last, setLast] = useState<RemoveChoice>();
    const remove = (choice: RemoveChoice) => {
      setLast(choice);
      setError(undefined);
      setState("removing");
      setTimeout(() => {
        if (attempts === 0) {
          setAttempts(1);
          setError("Não foi possível apagar o arquivo guardado. Tente de novo.");
          setState("idle");
        } else setState("gone");
      }, 1200);
    };
    return state === "gone" ? (
      <li style={{ listStyle: "none", color: "var(--color-text-muted)" }}>Fonte removida ({last === "archive" ? "Perguntas arquivadas" : "Perguntas mantidas"}).</li>
    ) : (
      <SourceRow {...args} questionCount={12} removing={state === "removing"} removeError={error} onRemove={remove} />
    );
  },
};
export const RemoverSemPerguntas: Story = { name: "Remover, sem Perguntas", args: { questionCount: 0 } };

export const Lista: Story = {
  name: "Lista de Fontes",
  render: () => (
    <>
      <SourceRow kind="pdf" name="Guia de alta disponibilidade.pdf" status="ready" excerptCount={48} extent="12 páginas" onRemove={() => {}} />
      <SourceRow kind="site" name="https://docs.exemplo.com.br/arquitetura/alta-disponibilidade" status="processing" steps={extracting} onRemove={() => {}} />
      <SourceRow kind="youtube" name="Alta disponibilidade em 40 minutos" status="failed" error="O vídeo não tem legenda" hint="Use outra Fonte." onRemove={() => {}} />
      <SourceRow kind="text" name="Anotações da aula 3" status="ready" excerptCount={1} onRemove={() => {}} />
      <SourceRow kind="docx" name="Resumo do módulo 2.docx" status="ready" excerptCount={19} extent="8 páginas" onRemove={() => {}} />
    </>
  ),
};
export const ListaCarregando: Story = {
  name: "Lista carregando",
  render: () => (
    <>
      {[0, 1, 2].map((i) => (
        <SourceRow key={i} kind="text" name="" status="loading" />
      ))}
    </>
  ),
};
