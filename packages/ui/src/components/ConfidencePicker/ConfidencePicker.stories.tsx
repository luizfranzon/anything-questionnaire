import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight } from "lucide-react";
import { Button } from "../Button/Button";
import { ConfidencePicker, type Confidence, type ConfidencePickerProps } from "./ConfidencePicker";

const meta = {
  title: "Componentes/ConfidencePicker",
  component: ConfidencePicker,
  decorators: [
    (Story) => (
      <div style={{ width: "var(--width-reading)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ConfidencePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

const darkPanel = (Story: () => React.ReactElement) => (
  <div style={{ background: "var(--color-dark)", padding: "var(--space-5)", borderRadius: "var(--radius-block)" }}>
    <Story />
  </div>
);

export const SemValor: Story = {};
export const Certeza: Story = { args: { value: "certeza" } };
export const Chutei: Story = { args: { value: "duvida" } };
export const SomenteLeitura: Story = { args: { value: "duvida", readOnly: true } };
export const DesabilitadoPorNaoSei: Story = {
  name: "Desabilitado (Não sei)",
  args: { disabledReason: "Não sei conta como erro." },
};
export const ErroAoGravar: Story = {
  name: "Erro ao gravar",
  args: { value: "certeza", error: true, onRetry: () => {} },
};
export const SobreForest: Story = { args: { onDark: true, value: "certeza" }, decorators: [darkPanel] };
export const SobreForestErro: Story = {
  name: "Sobre forest, erro ao gravar",
  args: { onDark: true, value: "duvida", error: true },
  decorators: [darkPanel],
};

/** Fluxo do modo estudo: após o acerto, a escolha é obrigatória e libera "Próxima". Setas trocam de opção. */
export const FluxoEstudo: Story = {
  name: "Fluxo (modo estudo)",
  render: () => {
    const [value, setValue] = useState<Confidence>();
    const [failing, setFailing] = useState(true);
    const [error, setError] = useState(false);
    return (
      <div
        style={{
          background: "var(--color-dark)",
          color: "var(--color-on-dark)",
          padding: "var(--space-5)",
          borderRadius: "var(--radius-block)",
          display: "grid",
          gap: "var(--space-4)",
        }}
      >
        <ConfidencePicker
          onDark
          value={value}
          error={error}
          onChange={(v) => {
            setValue(v);
            setError(failing);
          }}
          onRetry={() => {
            setFailing(false);
            setError(false);
          }}
        />
        <div>
          <Button onDark icon={<ArrowRight size={18} aria-hidden />} disabled={!value || error}>
            Próxima
          </Button>
        </div>
        <small style={{ color: "var(--color-on-dark-muted)" }}>
          A primeira escolha simula falha ao gravar. "Tentar de novo" resolve.
        </small>
      </div>
    );
  },
};

type Cell = { name: string; props: Partial<ConfidencePickerProps> };
const cells: Cell[] = [
  { name: "Normal", props: {} },
  { name: "Hover", props: { forceState: { option: "duvida", state: "hover" } } },
  { name: "Pressionado", props: { forceState: { option: "duvida", state: "pressed" } } },
  { name: "Foco (teclado)", props: { forceState: { option: "certeza", state: "focus" } } },
  { name: "Tinha certeza", props: { value: "certeza" } },
  { name: "Chutei", props: { value: "duvida" } },
  { name: "Selecionado + foco", props: { value: "certeza", forceState: { option: "certeza", state: "focus" } } },
  { name: "Desabilitado (Não sei)", props: { disabledReason: "Não sei conta como erro." } },
  { name: "Erro ao gravar", props: { value: "duvida", error: true } },
  { name: "Somente leitura, certeza", props: { value: "certeza", readOnly: true } },
  { name: "Somente leitura, chutei", props: { value: "duvida", readOnly: true } },
];

export const MatrizDeEstados: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 460px 460px",
        gap: "var(--space-4) var(--space-5)",
        padding: 32,
      }}
    >
      <div />
      <div style={{ font: "600 13px/18px var(--font-sans)" }}>Fundo claro (simulado)</div>
      <div style={{ font: "600 13px/18px var(--font-sans)" }}>Sobre forest (estudo)</div>
      {cells.map((c) => (
        <div key={c.name} style={{ display: "contents" }}>
          <div style={{ font: "600 13px/18px var(--font-sans)", paddingTop: 12 }}>{c.name}</div>
          <div>
            <ConfidencePicker {...c.props} />
          </div>
          <div style={{ background: "var(--color-dark)", padding: "var(--space-4)", borderRadius: "var(--radius-card)" }}>
            <ConfidencePicker onDark {...c.props} />
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: "fullscreen" },
};
