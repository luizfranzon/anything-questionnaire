import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button/Button";
import { RoundProgress } from "./RoundProgress";

const meta = {
  title: "Componentes/RoundProgress",
  component: RoundProgress,
  args: { current: 8, total: 20 },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--width-reading)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RoundProgress>;
export default meta;
type Story = StoryObj<typeof meta>;

export const MeioDaRodada: Story = {};
export const PrimeiraPergunta: Story = { args: { current: 1 } };
export const UltimaPergunta: Story = { args: { current: 20 } };
export const AtualRespondida: Story = { args: { currentAnswered: true } };
export const RodadaPequena: Story = { args: { current: 3, total: 5 } };
export const LimiteDePontos: Story = { args: { current: 18, total: 30 } };
export const RodadaGrandeBarra: Story = { args: { current: 18, total: 50 } };
export const RodadaMuitoGrande: Story = { args: { current: 64, total: 100 } };

/** Avança como na tela de responder: responde (preenche o ponto) e vai para a próxima. */
export const Interativo: Story = {
  render: () => {
    const [current, setCurrent] = useState(1);
    const [answered, setAnswered] = useState(false);
    return (
      <div style={{ display: "grid", gap: "var(--space-5)" }}>
        <RoundProgress current={current} total={20} currentAnswered={answered} />
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <Button variant="secondary" disabled={answered} onClick={() => setAnswered(true)}>
            Responder
          </Button>
          <Button
            disabled={!answered || current === 20}
            onClick={() => {
              setCurrent(current + 1);
              setAnswered(false);
            }}
          >
            Próxima
          </Button>
        </div>
      </div>
    );
  },
};

/** Matriz de estados e tamanhos. */
export const Matriz: Story = {
  render: () => {
    const rows: { name: string; props: React.ComponentProps<typeof RoundProgress> }[] = [
      { name: "Primeira (1/20)", props: { current: 1, total: 20 } },
      { name: "Meio (8/20)", props: { current: 8, total: 20 } },
      { name: "Meio, atual respondida", props: { current: 8, total: 20, currentAnswered: true } },
      { name: "Última (20/20)", props: { current: 20, total: 20, currentAnswered: true } },
      { name: "Pequena (3/5)", props: { current: 3, total: 5 } },
      { name: "Limite de pontos (18/30)", props: { current: 18, total: 30 } },
      { name: "Barra (18/50)", props: { current: 18, total: 50 } },
      { name: "Barra (64/100)", props: { current: 64, total: 100 } },
    ];
    return (
      <div style={{ display: "grid", gap: "var(--space-5)", width: "var(--width-reading)" }}>
        {rows.map((r) => (
          <div key={r.name} style={{ display: "grid", gap: "var(--space-2)" }}>
            <span style={{ font: "600 var(--text-caption)/var(--leading-caption) var(--font-sans)", color: "var(--color-text-muted)" }}>
              {r.name}
            </span>
            <RoundProgress {...r.props} />
          </div>
        ))}
      </div>
    );
  },
};
