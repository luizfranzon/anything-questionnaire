import type { Meta, StoryObj } from "@storybook/react-vite";
import { Info, Trash2 } from "lucide-react";
import { Button } from "../Button/Button";
import { Tooltip } from "./Tooltip";

const meta = {
  title: "Componentes/Tooltip",
  component: Tooltip,
  args: { content: "Excluir Estudo", side: "top", children: <span /> },
  argTypes: { side: { control: "inline-radio", options: ["top", "bottom", "left", "right"] } },
  decorators: [
    (Story) => (
      <div style={{ display: "grid", placeItems: "center", padding: "var(--space-8)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Passe o mouse (aparece após 400ms) ou chegue com Tab (aparece na hora). Esc fecha. */
export const Padrao: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <Button variant="secondary" icon={<Trash2 size={20} aria-hidden />} aria-label="Excluir Estudo" />
    </Tooltip>
  ),
};

export const TextoLongo: Story = {
  args: { content: "Pergunta anulada: ela não conta no Desempenho nem volta em novas Rodadas.", side: "bottom", children: <span /> },
  render: (args) => (
    <Tooltip {...args}>
      <Button variant="link" icon={<Info size={18} aria-hidden />}>
        O que é anulada?
      </Button>
    </Tooltip>
  ),
};

const caption: React.CSSProperties = { font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)" };

/** Os quatro lados, todos abertos. */
export const Lados: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 220px)", gap: "var(--space-8)", padding: "var(--space-8) var(--space-7)", justifyItems: "center" }}>
      {(["top", "bottom", "left", "right"] as const).map((s) => (
        <div key={s} style={{ display: "grid", gap: "var(--space-7)", justifyItems: "center", paddingBlock: 40 }}>
          <span style={caption}>{s}</span>
          <Tooltip content="Excluir Estudo" side={s} forceOpen>
            <Button variant="secondary">Botão</Button>
          </Tooltip>
        </div>
      ))}
    </div>
  ),
};
