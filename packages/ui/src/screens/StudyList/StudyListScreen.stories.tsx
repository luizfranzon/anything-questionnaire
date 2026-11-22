import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToastProvider } from "../../components/Toast/Toast";
import { StudyListScreen, type StudyListItem } from "./StudyListScreen";

const longName =
  "Preparação para o concurso de analista de tecnologia da informação do tribunal regional federal da terceira região";
const longGoal =
  "Edital de 2026 com direito administrativo, constitucional, banco de dados, redes, segurança da informação, engenharia de software e governança de TI, incluindo legislação específica do tribunal, jurisprudência recente dos tribunais superiores, resoluções do CNJ e normas de contratação de soluções de tecnologia, com ênfase nas matérias de maior peso na prova objetiva.";

const base: StudyListItem[] = [
  {
    id: "aws",
    name: "Certificação AWS Solutions Architect",
    goal: "Passar na prova SAA-C03 em março, com foco em redes, armazenamento e custo.",
    topicCount: 14,
    sourceCount: 5,
    lastActivity: "22/11",
    roundInProgress: { done: 8, total: 20 },
  },
  {
    id: "concurso",
    name: longName,
    goal: longGoal,
    topicCount: 32,
    sourceCount: 11,
    lastActivity: "21/11",
  },
  {
    id: "rust",
    name: "Rust para sistemas",
    goal: "Entender ownership, lifetimes e concorrência o bastante para contribuir em projetos de código aberto.",
    topicCount: 0,
    sourceCount: 2,
    lastActivity: "19/11",
  },
  {
    id: "estatistica",
    name: "Estatística aplicada",
    goal: "Revisar inferência e testes de hipótese.",
    topicCount: 9,
    sourceCount: 0,
    lastActivity: "14/11",
  },
  {
    id: "historia",
    name: "História do Brasil Império",
    goal: "Linha do tempo, personagens e causas da Independência à Proclamação.",
    topicCount: 12,
    sourceCount: 3,
    lastActivity: "02/11",
  },
  {
    id: "ingles",
    name: "Inglês técnico",
    goal: "Vocabulário de documentação e artigos.",
    topicCount: 6,
    sourceCount: 1,
  },
  {
    id: "seguranca",
    name: "Segurança da informação",
    goal: "Fundamentos para a CompTIA Security+.",
    topicCount: 18,
    sourceCount: 4,
    lastActivity: "27/10",
  },
];

const many: StudyListItem[] = Array.from({ length: 24 }, (_, i) => ({
  ...base[i % base.length],
  id: `m${i}`,
  name: `${base[i % base.length].name}${i >= base.length ? ` (${Math.floor(i / base.length) + 1})` : ""}`,
  roundInProgress: i === 0 ? base[0].roundInProgress : undefined,
}));

const meta = {
  title: "Telas/Lista de Estudos",
  component: StudyListScreen,
  parameters: { layout: "fullscreen" },
  args: { studies: base },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof StudyListScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Estado principal: nome e Objetivo longos, Estudo sem Fontes, sem atividade e com Tópicos por aprovar. */
export const Padrao: Story = {};

export const VazioPrimeiraVez: Story = { args: { studies: [] } };
export const UmEstudo: Story = { args: { studies: [base[0]] } };
export const Muitos: Story = { args: { studies: many } };
export const TextoMuitoLongo: Story = { args: { studies: [base[1]] } };
export const PrimeiraCarga: Story = { args: { studies: [], status: "loading" } };
export const Recarga: Story = { args: { status: "refreshing" } };
export const NaoCarregou: Story = { args: { studies: [], status: "error" } };

/** Folha de estado: confirmação de exclusão. */
export const ExcluirConfirmacao: Story = { args: { initialDelete: { id: "rust", step: "confirm" } } };
export const ExcluirGravando: Story = { args: { initialDelete: { id: "rust", step: "saving" } } };
export const ExcluirComErro: Story = { args: { initialDelete: { id: "rust", step: "error" } } };

/** Fluxo vivo: excluir, esperar um instante e ver o aviso. A segunda exclusão falha para mostrar o erro. */
export const ExcluirInterativo: Story = {
  render: (args) => {
    let calls = 0;
    return (
      <StudyListScreen
        {...args}
        onDelete={() =>
          new Promise<void>((resolve, reject) =>
            setTimeout(() => (++calls === 2 ? reject(new Error("falhou")) : resolve()), 1200),
          )
        }
      />
    );
  },
};
