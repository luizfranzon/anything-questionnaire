import type { Meta, StoryObj } from "@storybook/react-vite";
import { RoundHistoryRow } from "./RoundHistoryRow";

const meta = {
  title: "Componentes/RoundHistoryRow",
  component: RoundHistoryRow,
  args: { date: "22/11", mode: "study", correct: 14, answered: 20, onOpen: () => {} },
  decorators: [
    (Story) => (
      <ul style={{ margin: 0, padding: 0, maxWidth: "var(--width-content)" }}>
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof RoundHistoryRow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ModoEstudo: Story = { name: "Modo estudo" };
export const Simulado: Story = { args: { mode: "mock", correct: 31, answered: 40 } };
export const Hover: Story = { args: { forceState: "hover" } };
export const Foco: Story = { args: { forceState: "focus" } };
export const Encerrada: Story = { args: { ended: true, correct: 5, answered: 8, total: 20 } };
export const EncerradaSemRespostas: Story = { name: "Encerrada sem respostas", args: { ended: true, correct: 0, answered: 0, total: 20 } };
export const TodasErradas: Story = { name: "Todas erradas", args: { correct: 0, answered: 20 } };
export const TodasCertas: Story = { name: "Todas certas", args: { correct: 20, answered: 20 } };
export const Carregando: Story = { args: { status: "loading" } };

export const Historico: Story = {
  name: "Histórico",
  render: () => (
    <>
      <RoundHistoryRow date="22/11" mode="study" correct={14} answered={20} onOpen={() => {}} />
      <RoundHistoryRow date="20/11" mode="mock" correct={31} answered={40} onOpen={() => {}} />
      <RoundHistoryRow date="18/11" mode="study" correct={5} answered={8} total={20} ended onOpen={() => {}} />
      <RoundHistoryRow date="15/11" mode="study" correct={11} answered={20} onOpen={() => {}} />
    </>
  ),
};
