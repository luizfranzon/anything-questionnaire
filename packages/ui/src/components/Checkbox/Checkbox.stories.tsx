import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox, type CheckboxProps } from "./Checkbox";

const meta = {
  title: "Componentes/Checkbox",
  component: Checkbox,
  args: { label: "Embaralhar as Alternativas" },
  argTypes: { variant: { control: "inline-radio", options: ["plain", "card"] } },
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Marcado: Story = { args: { defaultChecked: true } };
export const Indeterminado: Story = { args: { checked: "indeterminate", label: "Todos os Tópicos" } };
export const ComDescricao: Story = {
  args: { description: "A ordem muda a cada Rodada, para não decorar a posição." },
};
export const ComAjuda: Story = { args: { help: "Vale só para as próximas Rodadas." } };
export const ComErro: Story = {
  args: { label: "Li e entendi que as Perguntas serão apagadas", error: "Marque para continuar." },
};
export const Desabilitado: Story = { args: { disabled: true, defaultChecked: true } };
export const Cartao: Story = {
  args: {
    variant: "card",
    label: "Incluir Perguntas anuladas",
    description: "Elas aparecem no banco, mas não entram nas Rodadas.",
  },
};

/** "Marcar todos" com estado parcial. */
export const MarcarTodos: Story = {
  render: () => {
    const topics = ["Redes", "Armazenamento", "Segurança"];
    const [on, setOn] = useState<string[]>(["Redes"]);
    const all = on.length === topics.length;
    return (
      <div>
        <Checkbox
          label="Todos os Tópicos"
          checked={all ? true : on.length ? "indeterminate" : false}
          onCheckedChange={(c) => setOn(c ? topics : [])}
        />
        <div style={{ paddingLeft: 36 }}>
          {topics.map((t) => (
            <Checkbox
              key={t}
              label={t}
              checked={on.includes(t)}
              onCheckedChange={(c) => setOn((s) => (c ? [...s, t] : s.filter((x) => x !== t)))}
            />
          ))}
        </div>
      </div>
    );
  },
};

const states: { name: string; props: Partial<CheckboxProps> }[] = [
  { name: "Normal", props: {} },
  { name: "Hover", props: { forceState: "hover" } },
  { name: "Pressionado", props: { forceState: "pressed" } },
  { name: "Foco (teclado)", props: { forceState: "focus" } },
  { name: "Marcado", props: { checked: true } },
  { name: "Marcado + hover", props: { checked: true, forceState: "hover" } },
  { name: "Marcado + foco", props: { checked: true, forceState: "focus" } },
  { name: "Indeterminado", props: { checked: "indeterminate" } },
  { name: "Erro", props: { error: "Marque para continuar." } },
  { name: "Desabilitado", props: { disabled: true } },
  { name: "Marcado desabilitado", props: { disabled: true, checked: true } },
];

export const MatrizDeEstados: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 380px)", gap: "24px 48px", padding: 32 }}>
      {(["plain", "card"] as const).map((variant) => (
        <div key={variant} style={{ display: "contents" }}>
          {states.map((s) => (
            <div key={variant + s.name}>
              <p style={{ margin: "0 0 8px", font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)" }}>
                {variant === "plain" ? "Simples" : "Cartão"} · {s.name}
              </p>
              <Checkbox
                variant={variant}
                label="Embaralhar as Alternativas"
                description={variant === "card" ? "A ordem muda a cada Rodada." : undefined}
                {...s.props}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};
