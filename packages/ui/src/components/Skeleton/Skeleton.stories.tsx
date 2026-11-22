import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton, SkeletonGroup } from "./Skeleton";

const meta = {
  title: "Componentes/Skeleton",
  component: Skeleton,
  decorators: [
    (Story) => (
      <div style={{ width: "var(--width-reading)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Texto: Story = {};
export const Paragrafo: Story = { args: { lines: 3 } };
export const Bloco: Story = { args: { shape: "block" } };
export const Circulo: Story = { args: { shape: "circle" } };

const caption: React.CSSProperties = { font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)" };
const card: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-4)",
  padding: "var(--space-4)",
  background: "var(--color-surface)",
  border: "2px solid var(--color-divider)",
  borderRadius: "var(--radius-card)",
};

/** Lista de Estudos carregando: três linhas com a forma do cartão final. */
export const Lista: Story = {
  render: () => (
    <SkeletonGroup label="Carregando Estudos">
      <div style={{ display: "grid", gap: "var(--space-3)" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={card}>
            <Skeleton shape="circle" />
            <div style={{ flex: 1, display: "grid" }}>
              <Skeleton width="45%" />
              <Skeleton width="70%" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonGroup>
  ),
};

/** Página de Estudo: título, resumo e dois blocos. */
export const Pagina: Story = {
  render: () => (
    <SkeletonGroup label="Carregando Estudo">
      <div style={{ display: "grid", gap: "var(--space-5)" }}>
        <Skeleton width="55%" height={32} />
        <Skeleton lines={3} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
          <Skeleton shape="block" height={120} />
          <Skeleton shape="block" height={120} />
        </div>
      </div>
    </SkeletonGroup>
  ),
};

/** As formas lado a lado. */
export const Matriz: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-5)" }}>
      {(
        [
          ["text", <Skeleton key="a" />],
          ["text, 3 linhas", <Skeleton key="b" lines={3} />],
          ["block", <Skeleton key="c" shape="block" />],
          ["circle", <Skeleton key="d" shape="circle" />],
        ] as const
      ).map(([name, el]) => (
        <div key={name} style={{ display: "grid", gap: "var(--space-2)" }}>
          <span style={caption}>{name}</span>
          {el}
        </div>
      ))}
    </div>
  ),
};
