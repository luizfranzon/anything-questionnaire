import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button/Button";
import { TextInput } from "../TextInput/TextInput";
import { Dialog, DialogPanel } from "./Dialog";

const meta = {
  title: "Componentes/Dialog",
  component: Dialog,
  args: { open: false, onClose: () => {}, title: "Novo Estudo" },
  parameters: { layout: "centered" },
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Abre de verdade, na camada do topo. Esc, clique fora e o X fecham; Tab fica preso dentro. */
export const Interativo: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Novo Estudo</Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Novo Estudo"
          description="Dê um nome e diga o que você quer aprender. Você adiciona as Fontes depois."
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setOpen(false)}>Criar Estudo</Button>
            </>
          }
        >
          <TextInput label="Nome" placeholder="Ex.: Redes para a certificação" />
          <TextInput label="Objetivo" placeholder="Ex.: Passar na prova em março" />
        </Dialog>
      </>
    );
  },
};

const footer = (
  <>
    <Button variant="secondary">Cancelar</Button>
    <Button>Criar Estudo</Button>
  </>
);
const canvas = { padding: 32, background: "var(--color-overlay)", borderRadius: "var(--radius-block)" } as const;

/** O cartão sem a janela modal, para ver o desenho. */
export const Pequeno: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={canvas}>
      <DialogPanel
        title="Renomear Tópico"
        description="O novo nome vale para as Perguntas já geradas."
        onClose={() => {}}
        footer={footer}
      />
    </div>
  ),
};
export const Medio: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={canvas}>
      <DialogPanel
        size="md"
        title="Novo Estudo"
        description="Dê um nome e diga o que você quer aprender."
        onClose={() => {}}
        footer={footer}
      >
        <TextInput label="Nome" placeholder="Ex.: Redes para a certificação" />
        <TextInput label="Objetivo" help="Aparece no topo do Estudo." />
      </DialogPanel>
    </div>
  ),
};
/** Corpo longo rola dentro do cartão; título e botões continuam à vista. */
export const ConteudoLongo: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ ...canvas, height: 480, overflow: "hidden" }}>
      <DialogPanel
        size="md"
        title="Trecho de origem"
        onClose={() => {}}
        footer={<Button variant="secondary">Fechar</Button>}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <p key={i} style={{ margin: 0, font: "400 17px/26px var(--font-sans)" }}>
            O protocolo TCP estabelece a conexão em três etapas antes de enviar dados, garantindo a ordem e a entrega dos
            segmentos entre origem e destino.
          </p>
        ))}
      </DialogPanel>
    </div>
  ),
};
export const BotaoFecharDesabilitado: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={canvas}>
      <DialogPanel
        title="Gravando"
        description="Aguarde, não feche esta janela."
        onClose={() => {}}
        busy
        footer={<Button loading>Salvar</Button>}
      />
    </div>
  ),
};
