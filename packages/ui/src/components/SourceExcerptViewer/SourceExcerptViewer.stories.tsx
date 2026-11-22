import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button/Button";
import { DialogPanel } from "../Dialog/Dialog";
import { ExcerptBody, ExcerptSource, SourceExcerptViewer, type SourceExcerptViewerProps } from "./SourceExcerptViewer";

const excerpt =
  "Para cargas de trabalho que não toleram perda de dados, configure uma réplica síncrona em outra zona de disponibilidade. Cada transação só é confirmada ao cliente depois de gravada nas duas cópias.\n\nO failover automático promove a réplica quando a instância primária fica indisponível por mais de 60 segundos. Durante a promoção, as conexões abertas são encerradas e o aplicativo precisa reconectar.";

const meta = {
  title: "Componentes/SourceExcerptViewer",
  component: SourceExcerptViewer,
  args: {
    open: false,
    onClose: () => {},
    source: "Guia de alta disponibilidade.pdf",
    kind: "pdf",
    location: "p. 14",
    excerpt,
  },
  parameters: { layout: "centered" },
} satisfies Meta<typeof SourceExcerptViewer>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Abre de verdade, na camada do topo. É o que a origem clicável do `CorrectionPanel` aciona. */
export const Interativo: Story = {
  render: (props) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Abrir o Trecho
        </Button>
        <SourceExcerptViewer {...props} open={open} onClose={() => setOpen(false)} />
      </>
    );
  },
};

/** Trecho longo: rola dentro do bloco, o diálogo não cresce. */
export const TrechoLongo: Story = {
  render: (props) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Abrir Trecho longo
        </Button>
        <SourceExcerptViewer
          {...props}
          open={open}
          onClose={() => setOpen(false)}
          excerpt={Array.from({ length: 6 }, () => excerpt).join("\n\n")}
        />
      </>
    );
  },
};

/** Os quatro estados lado a lado, sem a janela modal. */
export const Estados: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, max-content)", gap: "var(--space-6)", alignItems: "start" }}>
      {(["ready", "loading", "error", "unavailable"] as const).map((status) => (
        <DialogPanel
          key={status}
          size="md"
          title="Trecho de origem"
          description={<ExcerptSource source="Guia de alta disponibilidade.pdf" kind="pdf" location="p. 14" />}
          onClose={() => {}}
          footer={<Button variant="secondary">Fechar</Button>}
        >
          <ExcerptBody status={status} excerpt={excerpt} />
        </DialogPanel>
      ))}
    </div>
  ),
};

/** Cada tipo de Fonte e sua localização. */
export const Tipos: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {(
        [
          ["Notas da aula 3", "text", "seção 2"],
          ["Guia de alta disponibilidade.pdf", "pdf", "p. 14"],
          ["Diagrama de rede.png", "image", undefined],
          ["Resumo do módulo.docx", "docx", "seção 4"],
          ["docs.exemplo.com/failover", "site", undefined],
          ["Aula 7 · Replicação", "youtube", "12:40"],
        ] as const
      ).map(([source, kind, location]) => (
        <ExcerptSource key={source} source={source} kind={kind} location={location} />
      ))}
    </div>
  ),
};
