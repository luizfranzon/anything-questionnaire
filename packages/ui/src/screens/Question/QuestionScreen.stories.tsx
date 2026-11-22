import type { Meta, StoryObj } from "@storybook/react-vite";
import { QuestionScreen, type QuestionData } from "./QuestionScreen";

const question: QuestionData = {
  topic: "Replicação e failover",
  prompt:
    "Uma empresa precisa garantir que o banco de dados de pedidos continue disponível, sem perda de transações confirmadas, quando uma zona de disponibilidade inteira ficar indisponível. Qual abordagem atende melhor a esse requisito?",
  alternatives: [
    { id: "a", text: "Criar réplicas de leitura assíncronas em outra região e promovê-las manualmente." },
    { id: "b", text: "Manter uma réplica síncrona em outra zona de disponibilidade e promovê-la automaticamente quando a primária falhar." },
    { id: "c", text: "Fazer snapshots diários e restaurá-los quando houver falha." },
    { id: "d", text: "Executar duas instâncias primárias aceitando escrita ao mesmo tempo." },
  ],
  correctId: "b",
  explanations: {
    b: "Uma réplica síncrona confirma cada transação nas duas cópias antes de responder, então nenhuma transação confirmada se perde.",
    a: "Réplicas de leitura são assíncronas: transações recentes podem não ter chegado quando a primária cai.",
    c: "Um snapshot diário deixa até 24 horas de transações sem proteção e a restauração demora.",
    d: "Duas primárias exigem resolução de conflitos e não garantem a transação nas duas cópias.",
  },
  references: [{ source: "Guia de alta disponibilidade.pdf", location: "p. 14" }],
};

const meta = {
  title: "Telas/Pergunta",
  component: QuestionScreen,
  parameters: { layout: "fullscreen" },
  args: { mode: "study", round: { current: 8, total: 20 }, question },
} satisfies Meta<typeof QuestionScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

/* ---------- Modo estudo ---------- */
export const EstudoParaResponder: Story = {};
export const EstudoAlternativaMarcada: Story = { args: { initial: { selectedId: "b" } } };
export const EstudoGravando: Story = { args: { initial: { selectedId: "b", submitting: true } } };
export const EstudoErroAoGravar: Story = { args: { initial: { selectedId: "b", submitError: true } } };
export const EstudoAcertouSemConfianca: Story = { args: { initial: { selectedId: "b", answer: { pickedId: "b" } } } };
export const EstudoAcertouComConfianca: Story = {
  args: { initial: { selectedId: "b", answer: { pickedId: "b" }, confidence: "certeza" } },
};
export const EstudoErroAoGravarConfianca: Story = {
  args: { initial: { selectedId: "b", answer: { pickedId: "b" }, confidence: "duvida", confidenceError: true } },
};
export const EstudoErrou: Story = { args: { initial: { selectedId: "c", answer: { pickedId: "c" } } } };
export const EstudoNaoSei: Story = { args: { initial: { answer: { pickedId: null } } } };
export const EstudoComDivergencia: Story = {
  args: {
    question: { ...question, divergence: "A Fonte diz que réplicas assíncronas bastam, mas isso não evita perda de transações confirmadas." },
    initial: { selectedId: "c", answer: { pickedId: "c" } },
  },
};
export const EstudoConhecimentoGeral: Story = {
  args: { question: { ...question, references: [] }, initial: { selectedId: "b", answer: { pickedId: "b" }, confidence: "certeza" } },
};
export const EstudoRevisao: Story = { args: { question: { ...question, review: true } } };
export const EstudoUltimaPergunta: Story = {
  args: { round: { current: 20, total: 20 }, initial: { selectedId: "b", answer: { pickedId: "b" }, confidence: "certeza" } },
};
export const EstudoAvancando: Story = {
  args: { initial: { selectedId: "b", answer: { pickedId: "b" }, confidence: "certeza", advancing: true } },
};
export const EstudoContestacaoEmAnalise: Story = {
  args: { initial: { selectedId: "c", answer: { pickedId: "c" }, contestation: { status: "pending" } } },
};
export const EstudoContestacaoMantida: Story = {
  args: {
    initial: {
      selectedId: "c",
      answer: { pickedId: "c" },
      contestation: { status: "kept", justification: "A Explicação original cita a documentação do serviço, e a resolução às cegas chegou à mesma Alternativa." },
    },
  },
};
export const EstudoContestacaoCorrigida: Story = {
  args: { initial: { selectedId: "c", answer: { pickedId: "c" }, contestation: { status: "corrected" } } },
};
export const EstudoContestacaoAnulada: Story = {
  args: { initial: { selectedId: "c", answer: { pickedId: "c" }, contestation: { status: "voided" } } },
};

/* ---------- Diálogos ---------- */
export const ContestarFormulario: Story = {
  args: { initial: { selectedId: "c", answer: { pickedId: "c" }, contestOpen: true } },
};
export const ContestarGravando: Story = {
  args: { initial: { selectedId: "c", answer: { pickedId: "c" }, contestOpen: true, contestSubmitting: true } },
};
export const ContestarErro: Story = {
  args: { initial: { selectedId: "c", answer: { pickedId: "c" }, contestOpen: true, contestError: true } },
};
export const TrechoDeOrigem: Story = {
  args: { initial: { selectedId: "b", answer: { pickedId: "b" }, confidence: "certeza", excerpt: "ready" } },
};
export const TrechoCarregando: Story = {
  args: { initial: { selectedId: "b", answer: { pickedId: "b" }, confidence: "certeza", excerpt: "loading" } },
};
export const TrechoNaoCarregou: Story = {
  args: { initial: { selectedId: "b", answer: { pickedId: "b" }, confidence: "certeza", excerpt: "error" } },
};
export const TrechoFonteRemovida: Story = {
  args: { initial: { selectedId: "b", answer: { pickedId: "b" }, confidence: "certeza", excerpt: "unavailable" } },
};

/* ---------- Simulado ---------- */
export const SimuladoParaResponder: Story = { args: { mode: "mock", round: { current: 12, total: 40 } } };
export const SimuladoComConfianca: Story = {
  args: { mode: "mock", round: { current: 12, total: 40 }, initial: { selectedId: "b", confidence: "duvida" } },
};
export const SimuladoSemConfianca: Story = {
  args: { mode: "mock", round: { current: 12, total: 40 }, initial: { selectedId: "b", needConfidence: true } },
};
export const SimuladoGravando: Story = {
  args: { mode: "mock", round: { current: 12, total: 40 }, initial: { selectedId: "b", confidence: "certeza", submitting: true } },
};
export const SimuladoErroAoGravar: Story = {
  args: { mode: "mock", round: { current: 12, total: 40 }, initial: { selectedId: "b", confidence: "certeza", submitError: true } },
};
export const SimuladoMuitasPerguntas: Story = { args: { mode: "mock", round: { current: 87, total: 120 } } };

/* ---------- Sistema ---------- */
export const Carregando: Story = { args: { status: "loading", question: undefined } };
export const NaoCarregou: Story = { args: { status: "error", question: undefined } };
export const Anulada: Story = { args: { status: "voided" } };
