import type { Meta, StoryObj } from "@storybook/react-vite";
import { StudyFormScreen } from "./StudyFormScreen";

const longName =
  "Preparação para o concurso de analista de tecnologia da informação do tribunal regional federal da terceira região";
const longGoal =
  "Edital de 2026 com direito administrativo, constitucional, banco de dados, redes, segurança da informação, engenharia de software e governança de TI, incluindo legislação específica do tribunal, jurisprudência recente dos tribunais superiores, resoluções do CNJ e normas de contratação de soluções de tecnologia, com ênfase nas matérias de maior peso na prova objetiva e nas questões que mais caíram nos últimos três concursos da banca organizadora.";

const meta = {
  title: "Telas/Criação e edição de Estudo",
  component: StudyFormScreen,
  parameters: { layout: "fullscreen" },
  args: { mode: "create" },
} satisfies Meta<typeof StudyFormScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const CriarVazio: Story = {};
export const CriarPreenchido: Story = {
  args: {
    initial: {
      name: "Certificação AWS Solutions Architect",
      goal: "Passar na prova SAA-C03 em março, com foco em redes, armazenamento e custo.",
    },
  },
};
export const CriarComErrosDeValidacao: Story = { args: { showErrors: true } };
export const CriarGravando: Story = {
  args: { initial: { name: "Rust para sistemas", goal: "Entender ownership e concorrência." }, saving: true },
};
export const CriarErroAoGravar: Story = {
  args: {
    initial: { name: "Rust para sistemas", goal: "Entender ownership e concorrência." },
    saveError: "Confira se o aplicativo está rodando e tente de novo. O que você digitou foi mantido.",
  },
};
export const TextoMuitoLongo: Story = {
  args: { mode: "edit", initial: { name: longName, goal: longGoal } },
};
export const EditarPreenchido: Story = {
  args: {
    mode: "edit",
    initial: {
      name: "Certificação AWS Solutions Architect",
      goal: "Passar na prova SAA-C03 em março, com foco em redes, armazenamento e custo.",
    },
  },
};
export const EditarCarregando: Story = { args: { mode: "edit", status: "loading" } };
export const EditarNaoCarregou: Story = { args: { mode: "edit", status: "error" } };
export const EditarGravando: Story = {
  args: { mode: "edit", initial: { name: "Rust para sistemas", goal: "Entender ownership." }, saving: true },
};
