import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Trash2 } from "lucide-react";
import { Button } from "../Button/Button";
import { DialogPanel } from "../Dialog/Dialog";
import { InlineAlert } from "../InlineAlert/InlineAlert";
import { ConfirmDialog } from "./ConfirmDialog";

const meta = {
  title: "Componentes/ConfirmDialog",
  component: ConfirmDialog,
  args: {
    open: false,
    onClose: () => {},
    onConfirm: () => {},
    title: "Excluir o Estudo Redes?",
    children: "As 3 Fontes, os 12 Tópicos e as 184 Perguntas deste Estudo serão apagados. Não dá para desfazer.",
    confirmLabel: "Excluir Estudo",
  },
  parameters: { layout: "centered" },
} satisfies Meta<typeof ConfirmDialog>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Excluir Estudo (ticket 01). O foco começa em Cancelar. Confirmar grava por 1,5s: a primeira vez falha (erro no diálogo), a segunda conclui. */
export const ExcluirEstudo: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [attempts, setAttempts] = useState(0);
    // A primeira tentativa de cada abertura falha, para mostrar o erro; a segunda dá certo.
    const confirm = () => {
      setLoading(true);
      setError(undefined);
      setTimeout(() => {
        setLoading(false);
        if (attempts === 0) {
          setAttempts(1);
          setError("Não foi possível excluir o Estudo. Tente de novo.");
        } else setOpen(false);
      }, 1500);
    };
    return (
      <div style={{ display: "flex", gap: 12 }}>
        <Button
          variant="destructive"
          icon={<Trash2 size={18} aria-hidden />}
          onClick={() => {
            setAttempts(0);
            setError(undefined);
            setOpen(true);
          }}
        >
          Excluir Estudo
        </Button>
        <ConfirmDialog
          {...args}
          open={open}
          loading={loading}
          error={error}
          confirmIcon={<Trash2 size={18} aria-hidden />}
          onClose={() => setOpen(false)}
          onConfirm={confirm}
        />
      </div>
    );
  },
};

/** Remover Fonte (ticket 15). */
export const RemoverFonte: Story = {
  args: {
    title: "Remover a Fonte apostila-redes.pdf?",
    children: "Você escolhe a seguir se mantém ou arquiva as Perguntas geradas a partir dela.",
    confirmLabel: "Remover Fonte",
  },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Remover Fonte
        </Button>
        <ConfirmDialog {...args} open={open} onClose={() => setOpen(false)} onConfirm={() => setOpen(false)} />
      </>
    );
  },
};

/** Confirmação sem perda de dados: botão principal menta. */
export const NaoDestrutivo: Story = {
  args: {
    title: "Gerar uma nova Rodada?",
    children: "A Rodada em andamento (8/20) será encerrada e as respostas já dadas ficam salvas.",
    confirmLabel: "Gerar Rodada",
    tone: "default",
  },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Gerar Rodada</Button>
        <ConfirmDialog {...args} open={open} onClose={() => setOpen(false)} onConfirm={() => setOpen(false)} />
      </>
    );
  },
};

const canvas = { padding: 32, background: "var(--color-overlay)", borderRadius: "var(--radius-block)" } as const;

/** Os estados do cartão: normal, foco inicial em Cancelar, gravando, erro ao gravar. */
export const MatrizDeEstados: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ ...canvas, display: "grid", gridTemplateColumns: "repeat(2, auto)", gap: 32, justifyContent: "start" }}>
      {[
        { name: "Normal", loading: false, error: false },
        { name: "Gravando", loading: true, error: false },
        { name: "Erro ao gravar", loading: false, error: true },
      ].map((s) => (
        <div key={s.name} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ font: "600 13px/18px var(--font-sans)", color: "var(--color-on-dark)" }}>{s.name}</span>
          <DialogPanel
            title="Excluir o Estudo Redes?"
            description="As 3 Fontes, os 12 Tópicos e as 184 Perguntas serão apagados. Não dá para desfazer."
            onClose={() => {}}
            busy={s.loading}
            footer={
              <>
                <Button variant="secondary" disabled={s.loading}>
                  Cancelar
                </Button>
                <Button variant="destructive" loading={s.loading} icon={<Trash2 size={18} aria-hidden />}>
                  Excluir Estudo
                </Button>
              </>
            }
          >
            {s.error && <InlineAlert tone="danger">Não foi possível excluir o Estudo. Tente de novo.</InlineAlert>}
          </DialogPanel>
        </div>
      ))}
    </div>
  ),
};
