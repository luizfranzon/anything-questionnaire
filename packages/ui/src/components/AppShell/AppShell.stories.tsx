import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";

const meta = {
  title: "Componentes/AppShell",
  component: AppShell,
  parameters: { layout: "fullscreen" },
  args: {
    current: "studies",
    children: (
      <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
        Conteúdo da página. A largura segue a propriedade <code>width</code>.
      </p>
    ),
  },
  argTypes: {
    current: { control: "inline-radio", options: ["studies", "metrics", "settings"] },
    variant: { control: "inline-radio", options: ["default", "focus"] },
    width: { control: "inline-radio", options: ["reading", "content", "wide"] },
  },
} satisfies Meta<typeof AppShell>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Estudos: Story = {};
export const Metricas: Story = { args: { current: "metrics", width: "wide" } };
export const Configuracoes: Story = { args: { current: "settings" } };
export const SemSecaoAtual: Story = { args: { current: undefined } };

/** Barra reduzida para responder uma Pergunta, sem navegação. */
export const Foco: Story = { args: { variant: "focus", width: "reading" } };

/** Hover, pressionado e foco, um item por vez (o atual não muda de aparência no hover). */
export const EstadosDaNavegacao: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 24 }}>
      <AppShell {...args} current={undefined} forceState={{ studies: "hover" }}>
        {null}
      </AppShell>
      <AppShell {...args} current={undefined} forceState={{ metrics: "pressed" }}>
        {null}
      </AppShell>
      <AppShell {...args} current={undefined} forceState={{ settings: "focus", home: "focus" }}>
        {null}
      </AppShell>
    </div>
  ),
};

export const TresLarguras: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 24 }}>
      {(["reading", "content", "wide"] as const).map((w) => (
        <AppShell key={w} {...args} width={w}>
          <div style={{ padding: 16, background: "var(--color-fill-1)", borderRadius: "var(--radius-card)" }}>{w}</div>
        </AppShell>
      ))}
    </div>
  ),
};
