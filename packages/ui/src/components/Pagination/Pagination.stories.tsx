import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pagination, type PaginationProps } from "./Pagination";

const meta = {
  title: "Componentes/Pagination",
  component: Pagination,
  args: { page: 1, pageCount: 16, total: 312, pageSize: 20, onPageChange: () => {} },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--width-content)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Pagination>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Interativo: Story = {
  render: (args) => {
    const [page, setPage] = useState(1);
    return <Pagination {...args} page={page} onPageChange={setPage} />;
  },
};
export const Meio: Story = { args: { page: 8 } };
export const Ultima: Story = { args: { page: 16, total: 312 } };
export const PoucasPaginas: Story = { args: { page: 2, pageCount: 4, total: 70 } };
export const UmaPagina: Story = { args: { page: 1, pageCount: 1, total: 12 } };
export const SemContagem: Story = { args: { page: 5, total: undefined, pageSize: undefined } };

const caption: React.CSSProperties = { font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)" };

const rows: { name: string; props: Partial<PaginationProps> }[] = [
  { name: "Primeira página (Anterior desabilitado)", props: { page: 1 } },
  { name: "Perto do início", props: { page: 3 } },
  { name: "Meio, com reticências dos dois lados", props: { page: 8 } },
  { name: "Perto do fim", props: { page: 14 } },
  { name: "Última página (Próxima desabilitado)", props: { page: 16 } },
  { name: "Hover em página", props: { page: 8, forceState: { target: 9, state: "hover" } } },
  { name: "Pressionada", props: { page: 8, forceState: { target: 9, state: "pressed" } } },
  { name: "Foco (teclado) em Próxima", props: { page: 8, forceState: { target: "next", state: "focus" } } },
];

export const Matriz: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-5)", padding: "var(--space-6)", width: "var(--width-content)" }}>
      {rows.map((r) => (
        <div key={r.name} style={{ display: "grid", gap: "var(--space-2)" }}>
          <span style={caption}>{r.name}</span>
          <Pagination page={1} pageCount={16} total={312} pageSize={20} onPageChange={() => {}} {...r.props} />
        </div>
      ))}
    </div>
  ),
};
