import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, Trash2 } from "lucide-react";
import { Button, type ButtonProps, type ButtonVariant } from "./Button";

const meta = {
  title: "Componentes/Button",
  component: Button,
  args: { children: "Responder" },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "destructive", "link"] },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primario: Story = {};
export const Secundario: Story = { args: { variant: "secondary", children: "Cancelar" } };
export const Destrutivo: Story = {
  args: { variant: "destructive", children: "Excluir Estudo", icon: <Trash2 size={18} aria-hidden /> },
};
export const Link: Story = { args: { variant: "link", children: "Contestar" } };
export const ComIcone: Story = { args: { children: "Próxima", icon: <ArrowRight size={18} aria-hidden /> } };
export const Carregando: Story = { args: { loading: true, children: "Gerar Rodada" } };
export const Desabilitado: Story = { args: { disabled: true } };

/** Clique para ver a transição de carregando (rótulo some, spinner entra). */
export const CarregandoInterativo: Story = {
  render: (args) => {
    const [loading, setLoading] = useState(false);
    return (
      <Button
        {...args}
        loading={loading}
        onClick={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 1800);
        }}
      >
        Gerar Rodada
      </Button>
    );
  },
};

const variants: ButtonVariant[] = ["primary", "secondary", "destructive", "link"];
const states: { name: string; props: Partial<ButtonProps> }[] = [
  { name: "Normal", props: {} },
  { name: "Hover", props: { forceState: "hover" } },
  { name: "Pressionado", props: { forceState: "pressed" } },
  { name: "Foco (teclado)", props: { forceState: "focus" } },
  { name: "Desabilitado", props: { disabled: true } },
  { name: "Carregando", props: { loading: true } },
];
const labels: Record<ButtonVariant, string> = {
  primary: "Responder",
  secondary: "Cancelar",
  destructive: "Excluir",
  link: "Contestar",
};

function Matrix({ onDark }: { onDark?: boolean }) {
  const shown = onDark ? variants.filter((v) => v !== "destructive") : variants;
  const head = { font: "600 13px/18px var(--font-sans)", textAlign: "left", padding: "0 24px 12px 0" } as const;
  return (
    <div
      style={{
        background: onDark ? "var(--color-dark)" : "transparent",
        color: onDark ? "var(--color-on-dark)" : "inherit",
        borderRadius: "var(--radius-block)",
        padding: 32,
        overflowX: "auto",
      }}
    >
      <table style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th />
            {states.map((s) => (
              <th key={s.name} style={head}>
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((v) => (
            <tr key={v}>
              <th style={{ ...head, padding: "0 24px 0 0", whiteSpace: "nowrap" }}>{v}</th>
              {states.map((s) => (
                <td key={s.name} style={{ padding: "16px 24px 16px 0" }}>
                  <Button variant={v} onDark={onDark} {...s.props}>
                    {labels[v]}
                  </Button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const MatrizDeEstados: Story = { render: () => <Matrix />, parameters: { layout: "fullscreen" } };
export const MatrizSobreFundoEscuro: Story = {
  render: () => <Matrix onDark />,
  parameters: { layout: "fullscreen" },
};
