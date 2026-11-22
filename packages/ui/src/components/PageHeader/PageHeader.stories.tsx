import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus, Play, Pencil } from "lucide-react";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { PageHeader } from "./PageHeader";

const meta = {
  title: "Componentes/PageHeader",
  component: PageHeader,
  args: { title: "Estudos" },
  argTypes: { level: { control: "inline-radio", options: ["page", "section"] } },
} satisfies Meta<typeof PageHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SoTitulo: Story = {};

export const ComAcaoPrimaria: Story = {
  args: { actions: <Button icon={<Plus size={18} aria-hidden />}>Novo Estudo</Button> },
};

export const PaginaDoEstudo: Story = {
  args: {
    back: { label: "Estudos", href: "#" },
    title: "Certificação AWS Solutions Architect",
    description: "Passar na prova SAA-C03 em março, com foco em redes, armazenamento e custo.",
    meta: <Badge tone="info" icon={<Play size={14} aria-hidden />}>Rodada em andamento</Badge>,
    actions: (
      <>
        <Button variant="secondary" icon={<Pencil size={18} aria-hidden />}>Editar</Button>
        <Button>Nova Rodada</Button>
      </>
    ),
  },
};

export const PaginaInterna: Story = {
  args: { level: "section", back: { label: "Certificação AWS", href: "#" }, title: "Rodada de 22/11" },
};

export const SoAcoesSecundarias: Story = {
  args: { title: "Configurações", actions: <Button variant="secondary">Restaurar padrões</Button> },
};

export const TituloLongo: Story = {
  args: {
    back: { label: "Estudos", href: "#" },
    title: "Preparação para o concurso de analista de tecnologia da informação do tribunal regional federal da terceira região",
    description:
      "Edital de 2026 com direito administrativo, constitucional, banco de dados, redes, segurança da informação, engenharia de software e governança de TI, incluindo legislação específica do tribunal e jurisprudência recente dos tribunais superiores.",
    actions: <Button>Nova Rodada</Button>,
  },
};

export const Carregando: Story = {
  args: { back: { label: "Estudos", href: "#" }, description: "", loading: true, actions: <Button disabled>Nova Rodada</Button> },
};

export const EstadosDoVoltar: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 24 }}>
      {(["hover", "pressed", "focus"] as const).map((s) => (
        <PageHeader key={s} back={{ label: "Estudos" }} title={s} forceBackState={s} level="section" />
      ))}
    </div>
  ),
};
