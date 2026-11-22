import type { Meta, StoryObj } from "@storybook/react-vite";
import { IngestionProgress, type IngestionStep } from "./IngestionProgress";

const steps = (a: IngestionStep["status"], b: IngestionStep["status"], c: IngestionStep["status"], extra?: Partial<IngestionStep>[]): IngestionStep[] => [
  { id: "download", label: "Baixando", status: a, ...extra?.[0] },
  { id: "extract", label: "Extraindo", status: b, ...extra?.[1] },
  { id: "classify", label: "Classificando", status: c, ...extra?.[2] },
];

const meta = {
  title: "Componentes/IngestionProgress",
  component: IngestionProgress,
  args: { steps: steps("done", "active", "pending", [{}, { progress: 40 }]) },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "var(--width-sheet)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof IngestionProgress>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Extraindo: Story = {};
export const Baixando: Story = { args: { steps: steps("active", "pending", "pending") } };
export const Classificando: Story = { args: { steps: steps("done", "done", "active", [{}, {}, { progress: 75 }]) } };
export const Concluido: Story = { name: "Concluído", args: { steps: steps("done", "done", "done") } };
export const FalhaNoMeio: Story = {
  name: "Falha na etapa",
  args: { steps: steps("done", "error", "pending", [{}, { error: "Não foi possível ler o PDF: arquivo protegido por senha." }]) },
};
export const FonteDeTexto: Story = {
  name: "Texto colado (sem Baixando)",
  args: { steps: [steps("done", "active", "pending")[1], steps("done", "active", "pending")[2]].map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" })) as IngestionStep[] },
};

export const Compacta: Story = { args: { compact: true } };
export const CompactaIndeterminada: Story = { name: "Compacta, sem percentual", args: { compact: true, steps: steps("active", "pending", "pending") } };
export const CompactaFalha: Story = {
  name: "Compacta, falha",
  args: { compact: true, steps: steps("done", "error", "pending", [{}, { error: "Arquivo protegido por senha." }]) },
};
