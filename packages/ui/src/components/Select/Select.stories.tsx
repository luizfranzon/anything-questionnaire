import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Layers } from "lucide-react";
import { Select, type SelectOption, type SelectProps } from "./Select";

const models: SelectOption[] = [
  { value: "fable", label: "Fable 5.2", description: "US$ 15 / 75 por 1M de tokens" },
  { value: "opus", label: "Opus 5.5", description: "US$ 5 / 25 por 1M de tokens" },
  { value: "sonnet", label: "Sonnet 5.5", description: "US$ 3 / 15 por 1M de tokens" },
  { value: "haiku", label: "Haiku 5.5", description: "US$ 1 / 5 por 1M de tokens" },
];
const statuses: SelectOption[] = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Ativas" },
  { value: "voided", label: "Anuladas" },
  { value: "contested", label: "Contestadas" },
  { value: "archived", label: "Arquivadas", disabled: true },
];

const meta = {
  title: "Componentes/Select",
  component: Select,
  args: { label: "Modelo da Etapa", options: models, placeholder: "Escolha um modelo" },
  decorators: [
    (Story) => (
      <div style={{ width: 420, minHeight: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const ComValor: Story = { args: { defaultValue: "sonnet" } };
export const ComAjuda: Story = { args: { help: "Vale para a geração das Perguntas." } };
export const Opcional: Story = { args: { label: "Tópico", optional: true, options: statuses, placeholder: "Todos" } };
export const ComIcone: Story = { args: { icon: <Layers size={20} />, defaultValue: "opus" } };
export const OpcaoDesabilitada: Story = { args: { label: "Situação", options: statuses, defaultValue: "all" } };
export const ComErro: Story = { args: { error: "Escolha um modelo para esta Etapa." } };
export const Desabilitado: Story = { args: { defaultValue: "haiku", disabled: true } };
export const SomenteLeitura: Story = { args: { defaultValue: "haiku", readOnly: true } };
export const Carregando: Story = { args: { loading: true, placeholder: "Carregando modelos", help: "Buscando a lista." } };
export const SemOpcoes: Story = { args: { options: [], defaultOpen: true } };
export const Aberto: Story = { args: { defaultOpen: true, defaultValue: "opus" } };

/** Setas, Home, End, Enter, Espaço, Esc e digitar o começo do nome. */
export const Interativo: Story = {
  render: (args) => {
    const [value, setValue] = useState<string>();
    const [touched, setTouched] = useState(false);
    return (
      <Select
        {...args}
        value={value}
        onValueChange={(v) => {
          setValue(v);
          setTouched(true);
        }}
        error={touched && !value ? "Escolha um modelo para esta Etapa." : undefined}
        help="Vale para a geração das Perguntas."
      />
    );
  },
};

const cases: { name: string; props: Partial<SelectProps> }[] = [
  { name: "Normal", props: {} },
  { name: "Hover", props: { forceState: "hover" } },
  { name: "Foco (teclado)", props: { forceState: "focus" } },
  { name: "Preenchido", props: { defaultValue: "sonnet" } },
  { name: "Erro", props: { error: "Escolha um modelo para esta Etapa." } },
  { name: "Desabilitado", props: { defaultValue: "sonnet", disabled: true } },
  { name: "Somente leitura", props: { defaultValue: "sonnet", readOnly: true } },
  { name: "Carregando", props: { loading: true, placeholder: "Carregando modelos" } },
];

export const MatrizDeEstados: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 380px)", gap: "32px 48px", padding: 32 }}>
      {cases.map((c) => (
        <div key={c.name}>
          <p style={{ margin: "0 0 8px", font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)" }}>
            {c.name}
          </p>
          <Select label="Modelo da Etapa" options={models} placeholder="Escolha um modelo" {...c.props} />
        </div>
      ))}
      <div style={{ minHeight: 300 }}>
        <p style={{ margin: "0 0 8px", font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)" }}>
          Aberto
        </p>
        <Select label="Modelo da Etapa" options={models} defaultValue="opus" defaultOpen />
      </div>
    </div>
  ),
};
