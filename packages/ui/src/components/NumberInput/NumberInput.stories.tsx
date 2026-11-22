import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { NumberInput, type NumberInputProps } from "./NumberInput";

type Props = Omit<NumberInputProps, "value" | "onChange"> & { initial?: number | null };

/** Mantém o valor em estado local para as histórias. */
function Live({ initial = 20, ...props }: Props) {
  const [value, setValue] = useState<number | null>(initial);
  return <NumberInput {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: "Componentes/NumberInput",
  component: Live,
  args: { label: "Perguntas por Rodada", min: 5, max: 50, initial: 20 },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Live>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const ComUnidade: Story = { args: { label: "Revisar a cada", unit: "dias", min: 1, max: 365, initial: 7 } };
export const ComAjuda: Story = { args: { help: "Entre 5 e 50." } };
export const Decimal: Story = {
  args: { label: "Retenção desejada", min: 0.7, max: 0.99, step: 0.01, initial: 0.9, help: "Use vírgula." },
};
/** Abre com 80 (máximo 50) e o erro já visível. No uso real, o erro entra ao sair do campo. */
export const ForaDaFaixa: Story = { args: { initial: 80, forceTouched: true } };
export const Vazio: Story = { args: { initial: null, optional: true } };
export const Desabilitado: Story = { args: { disabled: true } };
export const SomenteLeitura: Story = { args: { readOnly: true } };

const cases: { name: string; props: Partial<Props> }[] = [
  { name: "Normal", props: {} },
  { name: "Hover", props: { forceState: "hover" } },
  { name: "Foco (teclado)", props: { forceState: "focus" } },
  { name: "No mínimo (− desabilitado)", props: { initial: 5 } },
  { name: "Erro de faixa", props: { initial: 80, forceTouched: true } },
  { name: "Desabilitado", props: { disabled: true } },
  { name: "Somente leitura", props: { readOnly: true } },
  { name: "Carregando", props: { loading: true } },
];

export const MatrizDeEstados: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 280px)", gap: "32px 48px", padding: 32 }}>
      {cases.map((c) => (
        <div key={c.name}>
          <p style={{ margin: "0 0 8px", font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)" }}>
            {c.name}
          </p>
          <Live label="Perguntas por Rodada" min={5} max={50} initial={20} {...c.props} />
        </div>
      ))}
    </div>
  ),
};
