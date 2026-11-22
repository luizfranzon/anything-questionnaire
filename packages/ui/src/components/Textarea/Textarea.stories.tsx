import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea, type TextareaProps } from "./Textarea";

const meta = {
  title: "Componentes/Textarea",
  component: Textarea,
  args: { label: "Texto da Fonte", placeholder: "Cole aqui o conteúdo que quer estudar." },
  decorators: [
    (Story) => (
      <div style={{ width: 520 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;
export default meta;
type Story = StoryObj<typeof meta>;

const longText =
  "O S3 guarda objetos em buckets. Cada objeto tem uma chave, um valor e metadados. A durabilidade padrão é de onze noves, e a disponibilidade varia conforme a classe de armazenamento escolhida.";

export const Padrao: Story = {};
/** Digite várias linhas: o campo cresce até 12 e depois rola. */
export const CresceComOConteudo: Story = { args: { defaultValue: longText } };
export const ComContador: Story = { args: { maxLength: 2000, defaultValue: longText, help: "Até 2000 caracteres." } };
export const ComErro: Story = { args: { error: "Cole ao menos uma frase.", defaultValue: "S3" } };
export const Desabilitado: Story = { args: { defaultValue: longText, disabled: true } };
export const SomenteLeitura: Story = { args: { defaultValue: longText, readOnly: true } };

const cases: { name: string; props: Partial<TextareaProps> }[] = [
  { name: "Normal", props: {} },
  { name: "Hover", props: { forceState: "hover" } },
  { name: "Foco (teclado)", props: { forceState: "focus" } },
  { name: "Preenchido com contador", props: { defaultValue: longText, maxLength: 2000 } },
  { name: "Erro", props: { defaultValue: "S3", error: "Cole ao menos uma frase." } },
  { name: "Desabilitado", props: { defaultValue: longText, disabled: true } },
  { name: "Somente leitura", props: { defaultValue: longText, readOnly: true } },
  { name: "Carregando", props: { defaultValue: longText, loading: true } },
];

export const MatrizDeEstados: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 460px)", gap: "32px 48px", padding: 32 }}>
      {cases.map((c) => (
        <div key={c.name}>
          <p style={{ margin: "0 0 8px", font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)" }}>
            {c.name}
          </p>
          <Textarea label="Texto da Fonte" placeholder="Cole aqui o conteúdo que quer estudar." {...c.props} />
        </div>
      ))}
    </div>
  ),
};
