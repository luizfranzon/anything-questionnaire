import type { Meta, StoryObj } from "@storybook/react-vite";
import { TrendIndicator } from "./TrendIndicator";

const meta = {
  title: "Componentes/TrendIndicator",
  component: TrendIndicator,
  args: { trend: "up", delta: 12 },
  argTypes: { trend: { control: "inline-radio", options: ["up", "flat", "down", "unknown"] } },
} satisfies Meta<typeof TrendIndicator>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Subindo: Story = {};
export const Estavel: Story = { name: "Estável", args: { trend: "flat", delta: undefined } };
export const Caindo: Story = { args: { trend: "down", delta: -8 } };
export const SemHistorico: Story = { name: "Sem histórico", args: { trend: "unknown", delta: undefined } };
export const SemVariacao: Story = { name: "Sem a variação", args: { delta: undefined } };
export const SoIcone: Story = { name: "Só o ícone", args: { iconOnly: true } };

export const Todos: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <TrendIndicator trend="up" delta={12} />
      <TrendIndicator trend="flat" />
      <TrendIndicator trend="down" delta={-8} />
      <TrendIndicator trend="unknown" />
    </div>
  ),
};
