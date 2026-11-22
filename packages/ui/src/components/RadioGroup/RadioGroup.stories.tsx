import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup } from "./RadioGroup";

const mode = [
  { value: "study", label: "Estudo", description: "Correção e Explicação a cada Pergunta." },
  { value: "exam", label: "Simulado", description: "Correção completa só no fim da Rodada." },
];
const keepOrArchive = [
  { value: "keep", label: "Manter as 12 Perguntas", description: "Continuam ativas e perdem o vínculo com os Trechos apagados." },
  { value: "archive", label: "Arquivar as 12 Perguntas", description: "Saem das Rodadas e do Desempenho; o histórico fica." },
];
const plain = [
  { value: "5", label: "5 Perguntas" },
  { value: "10", label: "10 Perguntas" },
  { value: "20", label: "20 Perguntas" },
];

const meta = {
  title: "Componentes/RadioGroup",
  component: RadioGroup,
  args: { legend: "Modo da Rodada", options: mode, variant: "card", defaultValue: "study" },
  argTypes: {
    variant: { control: "inline-radio", options: ["plain", "card"] },
    orientation: { control: "inline-radio", options: ["vertical", "horizontal"] },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 460 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ModoDaRodada: Story = {};
export const ManterOuArquivar: Story = {
  args: { legend: "O que fazer com as Perguntas desta Fonte?", options: keepOrArchive, defaultValue: "keep" },
};
export const Simples: Story = { args: { variant: "plain", legend: "Tamanho da Rodada", options: plain, defaultValue: "10" } };
export const SimplesNaLinha: Story = {
  args: { variant: "plain", orientation: "horizontal", legend: "Tamanho da Rodada", options: plain, defaultValue: "10" },
};
export const SemSelecao: Story = { args: { defaultValue: undefined, help: "Você pode mudar depois, na página do Estudo." } };
export const ComErro: Story = { args: { defaultValue: undefined, error: "Escolha um modo para começar." } };
export const Opcional: Story = { args: { optional: true, defaultValue: undefined } };
export const OpcaoDesabilitada: Story = {
  args: { options: [mode[0], { ...mode[1], disabled: true, description: "Disponível com 20 Perguntas ou mais." }] },
};
export const GrupoDesabilitado: Story = { args: { disabled: true } };

export const MatrizDeEstados: Story = {
  parameters: { layout: "fullscreen" },
  render: () => {
    const cases = [
      { name: "Normal", props: { defaultValue: undefined } },
      { name: "Hover", props: { defaultValue: undefined, forceState: { value: "exam", state: "hover" as const } } },
      { name: "Pressionado", props: { defaultValue: undefined, forceState: { value: "exam", state: "pressed" as const } } },
      { name: "Foco (teclado)", props: { defaultValue: undefined, forceState: { value: "exam", state: "focus" as const } } },
      { name: "Selecionado", props: { defaultValue: "study" } },
      { name: "Selecionado + hover", props: { defaultValue: "study", forceState: { value: "study", state: "hover" as const } } },
      { name: "Selecionado + foco", props: { defaultValue: "study", forceState: { value: "study", state: "focus" as const } } },
      { name: "Erro", props: { defaultValue: undefined, error: "Escolha um modo para começar." } },
      { name: "Desabilitado", props: { defaultValue: "study", disabled: true } },
    ];
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 420px)", gap: "32px 48px", padding: 32 }}>
        {(["plain", "card"] as const).map((variant) => (
          <div key={variant} style={{ display: "contents" }}>
            {cases.map((c) => (
              <div key={variant + c.name}>
                <p style={{ margin: "0 0 8px", font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)" }}>
                  {variant === "plain" ? "Simples" : "Cartão"} · {c.name}
                </p>
                <RadioGroup
                  legend="Modo da Rodada"
                  variant={variant}
                  options={variant === "plain" ? mode.map((m) => ({ ...m, description: undefined })) : mode}
                  {...c.props}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  },
};
