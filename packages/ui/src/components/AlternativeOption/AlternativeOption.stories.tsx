import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight } from "lucide-react";
import { Button } from "../Button/Button";
import { AlternativeOption, type AlternativeOptionProps } from "./AlternativeOption";

const meta = {
  title: "Componentes/AlternativeOption",
  component: AlternativeOption,
  args: { shortcut: "1", children: "Replica leituras em todas as zonas de disponibilidade" },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--width-reading)" }} role="radiogroup" aria-label="Alternativas">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AlternativeOption>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Neutra: Story = {};
export const Selecionada: Story = { args: { selected: true } };
export const Certa: Story = { args: { result: "correct", selected: true } };
export const Errada: Story = { args: { result: "wrong", selected: true } };
export const SomenteLeitura: Story = {
  name: "Somente leitura (simulado)",
  args: { readOnly: true, selected: true },
};
export const Desabilitada: Story = { args: { disabled: true } };
export const TextoLongo: Story = {
  args: {
    selected: true,
    children:
      "Mantém uma cópia síncrona em outra região e promove a réplica automaticamente quando a região primária fica indisponível, aceitando uma latência de escrita maior em troca de perda de dados zero",
  },
};

const options = [
  "Replica leituras em todas as zonas de disponibilidade",
  "Mantém uma réplica síncrona em outra zona e faz failover automático",
  "Cria um snapshot diário e o restaura manualmente em caso de falha",
  "Distribui as escritas entre duas instâncias primárias",
];
const correctIndex = 1;

/** Fluxo real: marcar, clicar em "Responder", ver a correção. Teclas 1 a 4 também marcam. */
export const Fluxo: Story = {
  render: () => {
    const [picked, setPicked] = useState<number | null>(null);
    const [answered, setAnswered] = useState(false);
    return (
      <div
        onKeyDown={(e) => {
          const n = Number(e.key);
          if (!answered && n >= 1 && n <= options.length) setPicked(n - 1);
        }}
        style={{ width: "var(--width-reading)", display: "grid", gap: "var(--space-2)" }}
        role="radiogroup"
        aria-label="Alternativas"
      >
        {options.map((text, i) => (
          <AlternativeOption
            key={text}
            shortcut={String(i + 1)}
            selected={picked === i}
            result={answered ? (i === correctIndex ? "correct" : picked === i ? "wrong" : undefined) : undefined}
            readOnly={answered}
            onClick={() => setPicked(i)}
          >
            {text}
          </AlternativeOption>
        ))}
        <div style={{ marginTop: "var(--space-4)" }}>
          <Button
            icon={<ArrowRight size={18} aria-hidden />}
            disabled={picked === null && !answered}
            onClick={() => {
              if (answered) {
                setAnswered(false);
                setPicked(null);
              } else setAnswered(true);
            }}
          >
            {answered ? "Reiniciar demo" : "Responder"}
          </Button>
        </div>
      </div>
    );
  },
};

const states: { name: string; props: Partial<AlternativeOptionProps> }[] = [
  { name: "Normal", props: {} },
  { name: "Hover", props: { forceState: "hover" } },
  { name: "Pressionada", props: { forceState: "pressed" } },
  { name: "Foco (teclado)", props: { forceState: "focus" } },
  { name: "Selecionada", props: { selected: true } },
  { name: "Selecionada + foco", props: { selected: true, forceState: "focus" } },
  { name: "Desabilitada", props: { disabled: true } },
  { name: "Certa", props: { result: "correct", selected: true } },
  { name: "Errada", props: { result: "wrong", selected: true } },
  { name: "Certa, não marcada", props: { result: "correct" } },
  { name: "Já respondida, sem marca", props: { readOnly: true } },
  { name: "Simulado, marcada", props: { readOnly: true, selected: true } },
];

export const MatrizDeEstados: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "180px 560px", gap: "var(--space-4) var(--space-5)", padding: 32 }}>
      {states.map((s) => (
        <div key={s.name} style={{ display: "contents" }}>
          <div style={{ font: "600 13px/18px var(--font-sans)", paddingTop: 16 }}>{s.name}</div>
          <AlternativeOption shortcut="2" {...s.props}>
            Mantém uma réplica síncrona em outra zona e faz failover automático
          </AlternativeOption>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: "fullscreen" },
};
