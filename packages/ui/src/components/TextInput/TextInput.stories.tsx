import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Link2 } from "lucide-react";
import { TextInput, type TextInputProps } from "./TextInput";

const meta = {
  title: "Componentes/TextInput",
  component: TextInput,
  args: { label: "Nome do Estudo", placeholder: "Ex.: Certificação AWS SAA" },
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const ComAjuda: Story = { args: { help: "Aparece na lista de Estudos." } };
export const Opcional: Story = { args: { label: "Objetivo", optional: true } };
export const ComIcone: Story = {
  args: { label: "Endereço do site", placeholder: "https://", icon: <Link2 size={20} />, type: "url" },
};
export const ComErro: Story = {
  args: { defaultValue: "htp:/exemplo", error: "Informe um endereço que comece com http:// ou https://." },
};
export const Desabilitado: Story = { args: { defaultValue: "Certificação AWS SAA", disabled: true } };
export const SomenteLeitura: Story = { args: { defaultValue: "Certificação AWS SAA", readOnly: true } };
export const Validando: Story = {
  args: { label: "Endereço do site", defaultValue: "https://exemplo.com", loading: true, help: "Checando o endereço." },
};

/** Apague o texto e saia do campo para ver o erro entrar e sair. */
export const ErroAoSair: Story = {
  render: (args) => {
    const [value, setValue] = useState("");
    const [touched, setTouched] = useState(false);
    return (
      <TextInput
        {...args}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => setTouched(true)}
        error={touched && !value.trim() ? "Dê um nome ao Estudo." : undefined}
        help="Aparece na lista de Estudos."
      />
    );
  },
};

const cases: { name: string; props: Partial<TextInputProps> }[] = [
  { name: "Normal", props: {} },
  { name: "Hover", props: { forceState: "hover" } },
  { name: "Foco (teclado)", props: { forceState: "focus" } },
  { name: "Preenchido", props: { defaultValue: "Certificação AWS SAA" } },
  { name: "Erro", props: { defaultValue: "htp:/exemplo", error: "Informe um endereço válido." } },
  { name: "Desabilitado", props: { defaultValue: "Certificação AWS SAA", disabled: true } },
  { name: "Somente leitura", props: { defaultValue: "Certificação AWS SAA", readOnly: true } },
  { name: "Carregando", props: { defaultValue: "https://exemplo.com", loading: true } },
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
          <TextInput label="Nome do Estudo" placeholder="Ex.: Certificação AWS SAA" {...c.props} />
        </div>
      ))}
    </div>
  ),
};
