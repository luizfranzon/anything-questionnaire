import type { Meta, StoryObj } from "@storybook/react-vite";
import { RoundInProgressBanner } from "./RoundInProgressBanner";

const meta = {
  title: "Componentes/RoundInProgressBanner",
  component: RoundInProgressBanner,
  args: { done: 8, total: 20, mode: "study", startedAt: "22/11", onResume: () => {} },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "var(--width-content)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RoundInProgressBanner>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ModoEstudo: Story = { name: "Modo estudo" };
export const Simulado: Story = { args: { mode: "mock", done: 12, total: 40 } };
export const NaPrimeiraPergunta: Story = { name: "Nenhuma respondida", args: { done: 0 } };
export const QuaseNoFim: Story = { name: "Falta uma", args: { done: 19 } };
export const SemData: Story = { name: "Sem data", args: { startedAt: undefined } };
export const Abrindo: Story = { args: { resuming: true } };
export const Erro: Story = { name: "Não abriu", args: { error: "Não foi possível abrir a Rodada. Suas Respostas estão salvas." } };
