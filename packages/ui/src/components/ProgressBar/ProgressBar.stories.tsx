import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressBar, type ProgressBarProps } from "./ProgressBar";

const meta = {
  title: "Componentes/ProgressBar",
  component: ProgressBar,
  args: { value: 40, label: "Gerando Rodada" },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--width-reading)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const ComContagem: Story = { args: { value: 12, max: 30, valueText: "12 de 30" } };
export const Indeterminada: Story = { args: { value: undefined, label: "Extraindo texto do PDF" } };
export const Concluida: Story = { args: { value: 100, status: "success", valueText: "Pronta" } };
export const ComErro: Story = { args: { value: 55, status: "error", valueText: "Falhou" } };
export const Compacta: Story = { args: { value: 72, compact: true, label: undefined, "aria-label": "Desempenho em Redes: 72%" } };

const dark: React.CSSProperties = {
  background: "var(--color-dark)",
  padding: "var(--space-5)",
  borderRadius: "var(--radius-card)",
};
export const SobreEscuro: Story = {
  args: { onDark: true },
  decorators: [
    (Story) => (
      <div style={dark}>
        <Story />
      </div>
    ),
  ],
};

/** Avança sozinha, como a geração da Rodada. */
export const Animada: Story = {
  render: () => {
    const [v, setV] = useState(0);
    useEffect(() => {
      const t = setInterval(() => setV((x) => (x >= 100 ? 0 : x + 20)), 1200);
      return () => clearInterval(t);
    }, []);
    return <ProgressBar value={v} label="Gerando Rodada" valueText={`${v / 5} de 20 Perguntas`} status={v === 100 ? "success" : "default"} />;
  },
};

const caption: React.CSSProperties = { font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)" };

const rows: { name: string; props: ProgressBarProps }[] = [
  { name: "Vazia (0%)", props: { value: 0, label: "Processando Fonte" } },
  { name: "Em andamento", props: { value: 40, label: "Processando Fonte" } },
  { name: "Com contagem", props: { value: 12, max: 30, label: "Gerando Rodada", valueText: "12 de 30" } },
  { name: "Indeterminada", props: { label: "Baixando", indeterminate: true } },
  { name: "Concluída", props: { value: 100, label: "Processando Fonte", status: "success", valueText: "Pronta" } },
  { name: "Erro", props: { value: 55, label: "Processando Fonte", status: "error", valueText: "Falhou" } },
  { name: "Compacta", props: { value: 72, compact: true, "aria-label": "Desempenho 72%" } },
  { name: "Compacta, vazia", props: { value: 0, compact: true, "aria-label": "Sem Respostas" } },
];

/** Estados em fundo claro e sobre escuro. */
export const Matriz: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "160px 420px 420px", gap: "var(--space-5) var(--space-5)", padding: "var(--space-6)", alignItems: "center" }}>
      <span />
      <span style={caption}>Fundo claro</span>
      <span style={caption}>Sobre escuro</span>
      {rows.map((r) => (
        <div key={r.name} style={{ display: "contents" }}>
          <span style={caption}>{r.name}</span>
          <ProgressBar {...r.props} />
          <div style={dark}>
            <ProgressBar {...r.props} onDark />
          </div>
        </div>
      ))}
    </div>
  ),
};
