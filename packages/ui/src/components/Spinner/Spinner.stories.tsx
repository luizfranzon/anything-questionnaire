import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner, type SpinnerSize } from "./Spinner";

const meta = {
  title: "Componentes/Spinner",
  component: Spinner,
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
} satisfies Meta<typeof Spinner>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Medio: Story = {};
export const Pequeno: Story = { args: { size: "sm" } };
export const Grande: Story = { args: { size: "lg" } };
export const SobreEscuro: Story = {
  args: { onDark: true },
  decorators: [
    (Story) => (
      <div style={{ background: "var(--color-dark)", padding: "var(--space-6)", borderRadius: "var(--radius-card)" }}>
        <Story />
      </div>
    ),
  ],
};

const sizes: SpinnerSize[] = ["sm", "md", "lg"];
const caption: React.CSSProperties = { font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)" };

/** Tamanhos em fundo claro e escuro. */
export const Matriz: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "120px 160px 160px", gap: "var(--space-4)", padding: "var(--space-6)", alignItems: "center" }}>
      <span />
      <span style={caption}>Fundo claro</span>
      <span style={caption}>Sobre escuro</span>
      {sizes.map((s) => (
        <div key={s} style={{ display: "contents" }}>
          <span style={caption}>{s}</span>
          <span>
            <Spinner size={s} />
          </span>
          <span style={{ background: "var(--color-dark)", padding: "var(--space-4)", borderRadius: "var(--radius-card)", display: "inline-flex", width: "fit-content" }}>
            <Spinner size={s} onDark />
          </span>
        </div>
      ))}
    </div>
  ),
};
