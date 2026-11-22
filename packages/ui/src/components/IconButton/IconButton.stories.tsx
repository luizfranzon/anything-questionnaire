import type { Meta, StoryObj } from "@storybook/react-vite";
import { Archive, Pencil, Trash2 } from "lucide-react";
import { IconButton } from "./IconButton";

const meta = {
  title: "Componentes/IconButton",
  component: IconButton,
  args: { label: "Renomear Redes", icon: <Pencil size={18} aria-hidden /> },
  argTypes: { tone: { control: "inline-radio", options: ["default", "danger"] } },
} satisfies Meta<typeof IconButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "Padrão" };
export const Perigo: Story = { args: { label: "Apagar Redes", icon: <Trash2 size={18} aria-hidden />, tone: "danger" } };
export const Desabilitado: Story = { args: { disabled: true } };
export const Pressionado: Story = { args: { pressed: true } };

export const Matriz: Story = {
  name: "Matriz de estados",
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, auto)", gap: 24, justifyContent: "start", alignItems: "center", fontFamily: "var(--font-sans)" }}>
      {(["default", "danger"] as const).map((tone) => {
        const icon = tone === "danger" ? <Trash2 size={18} aria-hidden /> : <Archive size={18} aria-hidden />;
        return (
          <div key={tone} style={{ display: "contents" }}>
            <IconButton tone={tone} label="Normal" icon={icon} />
            <IconButton tone={tone} label="Hover" icon={icon} forceState="hover" />
            <IconButton tone={tone} label="Pressionado" icon={icon} forceState="pressed" />
            <IconButton tone={tone} label="Foco" icon={icon} forceState="focus" />
            <IconButton tone={tone} label="Desabilitado" icon={icon} disabled />
          </div>
        );
      })}
    </div>
  ),
};
