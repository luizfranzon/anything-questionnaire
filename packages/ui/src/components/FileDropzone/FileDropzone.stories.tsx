import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileDropzone, type UploadItem } from "./FileDropzone";

const meta = {
  title: "Componentes/FileDropzone",
  component: FileDropzone,
  args: { onAdd: () => {} },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--width-reading)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileDropzone>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Vazia: Story = {};
export const UmArquivo: Story = { args: { multiple: false } };
export const Desabilitada: Story = { args: { disabled: true } };

const sample: UploadItem[] = [
  { id: "1", name: "apostila-redes.pdf", size: 4_200_000, status: "done" },
  { id: "2", name: "esquema-osi-camadas-com-nome-muito-comprido-para-testar-o-corte.png", size: 820_000, status: "uploading", progress: 42 },
  { id: "3", name: "resumo.docx", size: 96_000, status: "uploading" },
  { id: "4", name: "anotacoes.md", size: 12_300, status: "error", error: "Falhou ao enviar" },
  { id: "5", name: "prova-antiga.pdf", size: 9_100_000, status: "error", error: "PDF protegido por senha" },
];

/** Todas as situações de um arquivo na lista: enviado, enviando (com % e sem), erro com e sem motivo. */
export const ListaDeEnvios: Story = { args: { files: sample, onRemove: () => {}, onRetry: () => {} } };

/** Solte arquivos de verdade: o envio é simulado. .exe e arquivos grandes demais são recusados. */
export const Interativa: Story = {
  render: () => {
    const [files, setFiles] = useState<UploadItem[]>([]);
    useEffect(() => {
      const t = setInterval(() => {
        setFiles((list) =>
          list.map((f) =>
            f.status === "uploading" && f.progress !== undefined
              ? f.progress >= 100
                ? { ...f, status: "done" as const }
                : { ...f, progress: Math.min(100, f.progress + 20) }
              : f,
          ),
        );
      }, 500);
      return () => clearInterval(t);
    }, []);
    return (
      <FileDropzone
        files={files}
        onAdd={(added) =>
          setFiles((list) => [
            ...list,
            ...added.map((f, i) => ({
              id: `${Date.now()}-${i}`,
              name: f.name,
              size: f.size,
              status: "uploading" as const,
              progress: 0,
            })),
          ])
        }
        onRemove={(id) => setFiles((list) => list.filter((f) => f.id !== id))}
        onRetry={(id) => setFiles((list) => list.map((f) => (f.id === id ? { ...f, status: "uploading" as const, progress: 0 } : f)))}
      />
    );
  },
};

const caption: React.CSSProperties = { font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)", margin: "0 0 8px" };

/** A zona em cada estado: normal, hover, foco (teclado), arrastando por cima, desabilitada. */
export const MatrizDeEstados: Story = {
  parameters: { layout: "fullscreen" },
  decorators: [],
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 420px)", gap: 32, padding: 32, alignItems: "start" }}>
      {[
        { name: "Normal", props: {} },
        { name: "Hover", props: { forceState: "hover" as const } },
        { name: "Foco (teclado)", props: { forceState: "focus" as const } },
        { name: "Arrastando por cima", props: { forceState: "dragover" as const } },
        { name: "Desabilitada", props: { disabled: true } },
      ].map((s) => (
        <div key={s.name}>
          <p style={caption}>{s.name}</p>
          <FileDropzone onAdd={() => {}} {...s.props} />
        </div>
      ))}
    </div>
  ),
};
