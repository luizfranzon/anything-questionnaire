import type { Meta, StoryObj } from "@storybook/react-vite";
import type { BankResult } from "../../components/QuestionBank/QuestionBankRow";
import { StudyPageScreen, type StudyPageData, type StudyQuestion } from "./StudyPageScreen";

const topics: StudyPageData["topics"] = [
  { id: "t1", name: "Replicação e failover", performance: 32, trend: "down", delta: -8, answers: 25 },
  { id: "t2", name: "Backup e restauração", performance: 48, trend: "flat", delta: 0, answers: 18 },
  { id: "t3", name: "VPC, sub-redes e roteamento", performance: 55, trend: "up", delta: 12, answers: 31 },
  {
    id: "t4",
    name: "Arquiteturas orientadas a eventos com filas, tópicos e funções sem servidor para desacoplar cargas de trabalho",
    performance: 61,
    trend: "up",
    delta: 5,
    answers: 12,
  },
  { id: "t5", name: "Armazenamento de objetos (S3)", performance: 78, trend: "up", delta: 4, answers: 40 },
  { id: "t6", name: "Modelos de custo e reservas", performance: 90, trend: "flat", delta: 0, answers: 22 },
  { id: "t7", name: "Observabilidade e auditoria", performance: null, trend: "unknown", answers: 0 },
  { id: "t8", name: "Conformidade e governança", performance: 44, trend: "unknown", answers: 3, archived: true },
];

const results: BankResult[] = ["wrong", "right", "guess", "dontknow", "right", "never", "wrong", "right"];
const prompts = [
  "Qual configuração garante que nenhuma transação confirmada seja perdida se a zona primária cair?",
  "Qual é o principal risco de depender só de snapshots diários para recuperar um banco de dados de produção?",
  "Uma empresa precisa isolar a camada de banco de dados da internet e permitir saída controlada para atualizações. Qual desenho de rede atende?",
  "Qual serviço desacopla produtores e consumidores usando filas e garante a entrega pelo menos uma vez?",
  "Qual classe de armazenamento reduz o custo de objetos acessados raramente, mas exigindo recuperação em milissegundos?",
];

const makeQuestions = (n: number): StudyQuestion[] =>
  Array.from({ length: n }, (_, i) => {
    const t = topics[i % 7];
    return {
      id: `q${i}`,
      topicId: t.id,
      topic: t.name,
      prompt: prompts[i % prompts.length],
      result: results[i % results.length],
      status: i % 17 === 5 ? "voided" : i % 13 === 4 ? "contested" : i % 23 === 7 ? "archived" : undefined,
    };
  });

const data: StudyPageData = {
  id: "aws",
  name: "Certificação AWS Solutions Architect",
  goal: "Passar na prova SAA-C03 em março, com foco em redes, armazenamento e custo.",
  topics,
  dueReviews: 12,
  roundInProgress: { done: 8, total: 20, mode: "study", startedAt: "22/11" },
  rounds: [
    { id: "r5", date: "22/11", mode: "study", correct: 14, answered: 20, total: 20 },
    { id: "r4", date: "20/11", mode: "mock", correct: 31, answered: 40, total: 40 },
    { id: "r3", date: "18/11", mode: "study", correct: 5, answered: 8, total: 20, ended: true },
    { id: "r2", date: "15/11", mode: "study", correct: 9, answered: 15, total: 15 },
    { id: "r1", date: "12/11", mode: "study", correct: 6, answered: 10, total: 10 },
  ],
  questions: makeQuestions(63),
  sources: [
    { id: "s1", kind: "pdf", name: "Guia de alta disponibilidade.pdf", status: "ready", excerptCount: 84, extent: "112 páginas", questionCount: 23 },
    {
      id: "s2",
      kind: "site",
      name: "https://docs.exemplo.com.br/arquitetura/boas-praticas/confiabilidade/alta-disponibilidade-multi-regiao",
      status: "ready",
      excerptCount: 21,
      questionCount: 9,
    },
    {
      id: "s3",
      kind: "youtube",
      name: "Aula 7: Redes na nuvem",
      status: "processing",
      steps: [
        { id: "a", label: "Baixando", status: "done" },
        { id: "b", label: "Extraindo", status: "active", progress: 60 },
        { id: "c", label: "Classificando", status: "pending" },
      ],
    },
    {
      id: "s4",
      kind: "site",
      name: "https://exemplo.com/artigo-restrito",
      status: "failed",
      error: "A página exige login.",
      hint: "Cole o texto da página como Fonte de texto.",
    },
    { id: "s5", kind: "text", name: "Anotações da aula", status: "ready", excerptCount: 6, questionCount: 0 },
  ],
};

const meta = {
  title: "Telas/Página do Estudo",
  component: StudyPageScreen,
  parameters: { layout: "fullscreen" },
  args: { data },
} satisfies Meta<typeof StudyPageScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Estado principal: Tópicos do mais fraco ao mais forte, Revisões vencidas e Rodada em andamento. */
export const Topicos: Story = {};
export const Rodadas: Story = { args: { initialTab: "rounds" } };
export const Perguntas: Story = { args: { initialTab: "questions" } };
export const Fontes: Story = { args: { initialTab: "sources" } };
export const GerenciarTopicos: Story = { args: { initialTab: "manage" } };

export const PerguntasFiltradasSemResultado: Story = {
  args: { initialTab: "questions", initialFilters: { topic: "t7", result: "right", status: "voided" } },
};
export const PerguntasCarregando: Story = { args: { initialTab: "questions", questionsStatus: "loading" } };
export const PerguntasNaoCarregaram: Story = { args: { initialTab: "questions", questionsStatus: "error" } };

export const ContinuandoRodada: Story = { args: { resuming: true } };
export const SemRodadaEmAndamento: Story = { args: { data: { ...data, roundInProgress: undefined, dueReviews: 0 } } };

/** Estudo criado só com Objetivo: a proposta de Tópicos ainda não foi aprovada. */
export const TopicosPorAprovar: Story = {
  args: {
    data: {
      ...data,
      topics: [],
      proposalPending: true,
      dueReviews: 0,
      roundInProgress: undefined,
      rounds: [],
      questions: [],
      sources: [],
    },
  },
};

/** Estudo aprovado, sem Rodadas, Perguntas nem Fontes. */
export const EstudoNovo: Story = {
  args: {
    data: {
      ...data,
      topics: topics.slice(0, 3).map((t) => ({ ...t, performance: null, trend: "unknown", answers: 0 })),
      dueReviews: 0,
      roundInProgress: undefined,
      rounds: [],
      questions: [],
      sources: [],
    },
  },
};
export const EstudoNovoRodadas: Story = { name: "Estudo novo · Rodadas vazias", args: { ...EstudoNovo.args, initialTab: "rounds" } };
export const EstudoNovoPerguntas: Story = { name: "Estudo novo · Perguntas vazias", args: { ...EstudoNovo.args, initialTab: "questions" } };
export const EstudoNovoFontes: Story = { name: "Estudo novo · Fontes vazias", args: { ...EstudoNovo.args, initialTab: "sources" } };

export const Carregando: Story = { args: { status: "loading", data: undefined } };
export const NaoCarregou: Story = { args: { status: "error", data: undefined } };
