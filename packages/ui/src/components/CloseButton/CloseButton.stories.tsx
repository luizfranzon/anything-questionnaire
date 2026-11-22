import type { Meta, StoryObj } from "@storybook/react-vite";
import { CloseButton, type CloseButtonProps } from "./CloseButton";

const meta = {
  title: "Componentes/CloseButton",
  component: CloseButton,
} satisfies Meta<typeof CloseButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

const states: { name: string; props: Partial<CloseButtonProps> }[] = [
  { name: "Normal", props: {} },
  { name: "Hover", props: { forceState: "hover" } },
  { name: "Pressionado", props: { forceState: "pressed" } },
  { name: "Foco (teclado)", props: { forceState: "focus" } },
  { name: "Desabilitado", props: { disabled: true } },
];

function Row({ onDark }: { onDark?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 40,
        padding: 32,
        borderRadius: "var(--radius-block)",
        background: onDark ? "var(--color-dark)" : "transparent",
      }}
    >
      {states.map((s) => (
        <div key={s.name} style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
          <span
            style={{
              font: "600 13px/18px var(--font-sans)",
              color: onDark ? "var(--color-on-dark)" : "var(--color-text)",
            }}
          >
            {s.name}
          </span>
          <CloseButton onDark={onDark} {...s.props} />
        </div>
      ))}
    </div>
  );
}

export const MatrizDeEstados: Story = { render: () => <Row />, parameters: { layout: "fullscreen" } };
export const MatrizSobreFundoEscuro: Story = { render: () => <Row onDark />, parameters: { layout: "fullscreen" } };
