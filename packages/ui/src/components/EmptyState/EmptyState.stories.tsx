import type { Meta, StoryObj } from "@storybook/react-vite";
import { BookOpen, FileUp, FolderOpen, SearchX, WifiOff } from "lucide-react";
import { Button } from "../Button/Button";
import { EmptyState } from "./EmptyState";

const meta = {
  title: "Componentes/EmptyState",
  component: EmptyState,
  args: {
    icon: <BookOpen size={28} />,
    title: "Nenhum Estudo ainda",
    children: "Crie um Estudo com um Objetivo e as Fontes que você quer dominar.",
    action: <Button>Criar Estudo</Button>,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--width-content)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Lista de Estudos vazia (ticket 01). */
export const Pagina: Story = {};

/** Estudo sem Fontes: um lugar a preencher, então contorno tracejado. */
export const SemFontes: Story = {
  args: {
    icon: <FileUp size={28} />,
    title: "Este Estudo não tem Fontes",
    children: "Adicione texto, PDF, imagem, DOCX, site ou vídeo do YouTube para gerar Perguntas.",
    action: <Button>Adicionar Fonte</Button>,
    size: "compact",
    outlined: true,
  },
};

/** Filtros do banco de Perguntas sem resultado (ticket 10). */
export const SemResultado: Story = {
  args: {
    icon: <SearchX size={28} />,
    title: "Nenhuma Pergunta com esses filtros",
    children: "Tente outro Tópico ou limpe os filtros.",
    action: <Button variant="secondary">Limpar filtros</Button>,
    size: "compact",
  },
};

/** Lista que não carregou: ícone berry, e a ação é tentar de novo. */
export const NaoCarregou: Story = {
  args: {
    icon: <WifiOff size={28} />,
    title: "Não foi possível carregar os Estudos",
    children: "Confira a conexão e tente de novo.",
    action: <Button variant="secondary">Tentar de novo</Button>,
    tone: "danger",
  },
};

export const SemAcao: Story = {
  args: { icon: <FolderOpen size={28} />, title: "Nenhuma Rodada ainda", children: "As Rodadas que você terminar aparecem aqui.", action: undefined, size: "compact" },
};

/** Os dois tamanhos e os dois tons lado a lado. */
export const MatrizDeVariantes: Story = {
  parameters: { layout: "fullscreen" },
  decorators: [],
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 460px)", gap: 24, padding: 32, alignItems: "start" }}>
      <EmptyState size="page" icon={<BookOpen size={28} />} title="Nenhum Estudo ainda" action={<Button>Criar Estudo</Button>}>
        Crie um Estudo com um Objetivo e as Fontes.
      </EmptyState>
      <EmptyState size="page" tone="danger" icon={<WifiOff size={28} />} title="Não carregou" action={<Button variant="secondary">Tentar de novo</Button>}>
        Confira a conexão e tente de novo.
      </EmptyState>
      <EmptyState size="compact" outlined icon={<FileUp size={28} />} title="Sem Fontes" action={<Button>Adicionar Fonte</Button>}>
        Adicione a primeira Fonte do Estudo.
      </EmptyState>
      <EmptyState size="compact" icon={<SearchX size={28} />} title="Nenhum resultado">
        Tente outros filtros.
      </EmptyState>
    </div>
  ),
};
