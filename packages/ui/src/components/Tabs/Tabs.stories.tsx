import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, type TabItem } from "./Tabs";

const body = (text: string) => (
  <p style={{ margin: 0, font: "400 var(--text-body)/var(--leading-body) var(--font-sans)", color: "var(--color-text)" }}>{text}</p>
);

const items: TabItem[] = [
  { id: "resumo", label: "Resumo", panel: body("Resumo do Estudo: Objetivo, Tópicos e Desempenho.") },
  { id: "fontes", label: "Fontes", count: 4, panel: body("Quatro Fontes processadas.") },
  { id: "perguntas", label: "Perguntas", count: 128, panel: body("Banco de Perguntas do Estudo.") },
  { id: "rodadas", label: "Rodadas", count: 12, panel: body("Histórico de Rodadas.") },
];

const meta = {
  title: "Componentes/Tabs",
  component: Tabs,
  args: { items, "aria-label": "Seções do Estudo" },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--width-content)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const ComAbaDesabilitada: Story = {
  args: { items: items.map((i) => (i.id === "rodadas" ? { ...i, disabled: true } : i)) },
};
export const SemContadores: Story = { args: { items: items.map(({ count: _c, ...i }) => i) } };

const caption: React.CSSProperties = { font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)" };
const none = (id: string, label: string, extra: Partial<TabItem> = {}): TabItem => ({ id, label, panel: null, ...extra });

/** Estados de uma aba. Setas, Home e End movem a seleção. */
export const Matriz: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-5)", padding: "var(--space-6)", width: "var(--width-content)" }}>
      {(
        [
          ["Normal e selecionada", [none("a", "Resumo"), none("b", "Fontes", { count: 4 })], "a"],
          ["Hover", [none("a", "Resumo"), none("b", "Fontes", { forceState: "hover" })], "a"],
          ["Pressionada", [none("a", "Resumo"), none("b", "Fontes", { forceState: "pressed" })], "a"],
          ["Foco (teclado)", [none("a", "Resumo", { forceState: "focus" }), none("b", "Fontes")], "a"],
          ["Desabilitada", [none("a", "Resumo"), none("b", "Fontes", { disabled: true, count: 4 })], "a"],
        ] as const
      ).map(([name, its, v]) => (
        <div key={name} style={{ display: "grid", gap: "var(--space-2)" }}>
          <span style={caption}>{name}</span>
          <Tabs items={[...its]} value={v} aria-label={name} />
        </div>
      ))}
    </div>
  ),
};
