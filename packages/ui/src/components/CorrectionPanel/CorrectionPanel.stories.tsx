import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CorrectionPanel, type CorrectionPanelProps } from "./CorrectionPanel";
import { QuestionCard, type QuestionCardProps } from "../QuestionCard/QuestionCard";
import type { Confidence } from "../ConfidencePicker/ConfidencePicker";

const explanations: CorrectionPanelProps["explanations"] = [
  {
    letter: "B",
    correct: true,
    why: "Uma réplica síncrona em outra zona confirma cada transação nas duas cópias antes de responder ao cliente, então nenhuma transação confirmada se perde. O failover automático promove a réplica sem intervenção manual.",
  },
  {
    letter: "A",
    why: "Réplicas de leitura recebem os dados de forma assíncrona e não participam do failover de escrita. Uma queda da zona primária pode perder transações ainda não replicadas.",
  },
  {
    letter: "C",
    picked: true,
    why: "Um snapshot diário deixa até 24 horas de transações sem proteção, e a restauração manual aumenta o tempo de indisponibilidade.",
  },
  {
    letter: "D",
    why: "Duas instâncias primárias aceitando escrita exigem resolução de conflitos e não garantem, por si só, que a transação confirmada exista nas duas.",
  },
];

const refs = [{ source: "Guia de alta disponibilidade.pdf", location: "p. 14" }];

const base: CorrectionPanelProps = {
  outcome: "correct",
  explanations: explanations.map((e) => ({ ...e, picked: e.letter === "B" })),
  references: refs,
};

const meta = {
  title: "Componentes/CorrectionPanel",
  component: CorrectionPanel,
  args: base,
  decorators: [
    (Story) => (
      <div style={{ width: "calc(var(--width-reading) - 2 * var(--space-6))" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CorrectionPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

// Acerto
export const AcertoSemConfianca: Story = { name: "Acerto, sem Confiança (Próxima desabilitada)" };
export const AcertoComConfianca: Story = { name: "Acerto, com Confiança", args: { confidence: "certeza" } };
export const AcertoErroAoGravar: Story = {
  name: "Acerto, erro ao gravar a Confiança",
  args: { confidence: "duvida", confidenceError: true, onRetryConfidence: () => {} },
};
export const AcertoAvancando: Story = { name: "Acerto, avançando", args: { confidence: "certeza", advancing: true } };
export const UltimaPergunta: Story = { name: "Última Pergunta", args: { confidence: "certeza", last: true } };

// Erro e "Não sei"
export const Erro: Story = {
  args: { outcome: "wrong", explanations: explanations.map((e) => ({ ...e, picked: e.letter === "C" })) },
};
export const NaoSei: Story = {
  name: "Não sei",
  args: { outcome: "dontknow", explanations: explanations.map((e) => ({ ...e, picked: false })) },
};

// Origem
export const ConhecimentoGeral: Story = { name: "Origem: conhecimento geral", args: { references: [] } };
export const VariasFontes: Story = {
  name: "Origem: várias Fontes, nome longo",
  args: {
    references: [
      { source: "Documentação oficial do Amazon RDS para PostgreSQL, edição de 2025, capítulo sobre Multi-AZ e failover.pdf", location: "p. 214" },
      { source: "youtube.com/watch?v=Zq3xK9", location: "12:40" },
      { source: "Anotações da aula 7" },
    ],
  },
};
export const Divergencia: Story = {
  name: "Aviso de divergência",
  args: {
    divergence:
      "A Fonte diz que o failover leva cerca de 5 minutos. A documentação atual do serviço indica de 60 a 120 segundos, e o Gabarito segue a documentação.",
  },
};

// Anulada e Contestação
export const Anulada: Story = {
  args: { outcome: "voided", explanations: [], references: [], contestation: undefined },
};
export const Contestar: Story = {
  name: "Contestar (ação disponível)",
  args: { outcome: "wrong", explanations: explanations.map((e) => ({ ...e, picked: e.letter === "C" })), onContest: () => {} },
};
export const ContestacaoEmAnalise: Story = {
  name: "Contestação em análise",
  args: { outcome: "wrong", explanations: explanations.map((e) => ({ ...e, picked: e.letter === "C" })), contestation: { status: "pending" } },
};
export const ContestacaoMantida: Story = {
  name: "Contestação, Gabarito mantido",
  args: {
    outcome: "wrong",
    explanations: explanations.map((e) => ({ ...e, picked: e.letter === "C" })),
    contestation: {
      status: "kept",
      justification:
        "A documentação do serviço confirma que a réplica síncrona em outra zona é o único arranjo listado que garante zero perda de transações confirmadas.",
    },
  },
};
export const ContestacaoCorrigida: Story = {
  name: "Contestação, Gabarito corrigido",
  args: { contestation: { status: "corrected" }, confidence: "certeza", readOnly: true },
};
export const ContestacaoAnulada: Story = {
  name: "Contestação, Pergunta anulada",
  args: { outcome: "voided", explanations: [], references: [], contestation: { status: "voided" } },
};

// Histórico
export const SomenteLeitura: Story = {
  name: "Somente leitura (histórico)",
  args: { readOnly: true, confidence: "duvida", onContest: () => {} },
};

// Texto longo
export const TextoLongo: Story = {
  name: "Texto longo",
  args: {
    outcome: "wrong",
    divergence:
      "A Fonte afirma que a replicação multirregional síncrona é suportada em qualquer plano, mas a documentação atual restringe o recurso aos planos corporativos e a regiões específicas, e por isso o Gabarito considera a restrição.",
    explanations: [
      {
        letter: "A",
        correct: true,
        why: (
          <>
            Mantém uma cópia síncrona em outra região e promove a réplica automaticamente quando a região primária fica
            indisponível. A latência de escrita aumenta porque cada transação espera a confirmação da segunda região, mas
            o requisito de perda de dados zero é atendido e o orçamento comporta apenas duas regiões ativas por
            transação. Em produção, vale monitorar o atraso de replicação e testar o failover periodicamente com{" "}
            <code>SELECT pg_is_in_recovery();</code> na réplica.
          </>
        ),
      },
      {
        letter: "B",
        picked: true,
        why: "A replicação assíncrona entre as três regiões reduz a latência de escrita, mas permite perder as últimas transações confirmadas se a região primária cair antes de replicar. Isso viola o requisito de nenhuma perda, mesmo que a janela seja de poucos segundos.",
      },
      { letter: "C", why: "Snapshot diário com restauração manual deixa até 24 horas sem proteção." },
      {
        letter: "D",
        why: "Escrita multi-primária com último escritor vence pode descartar escritas concorrentes legítimas, o que em pagamentos significa perder transações.",
      },
    ],
    references: [
      { source: "Arquitetura de pagamentos multirregional: replicação, consistência e failover em bancos distribuídos.md", location: "seção 4.2" },
    ],
    onContest: () => {},
  },
};

/** Fluxo real dentro do QuestionCard: responder, ver a correção, escolher a Confiança e avançar. */
export const Fluxo: StoryObj<QuestionCardProps> = {
  decorators: [],
  render: () => {
    const alternatives = [
      { id: "a", text: "Replica leituras em todas as zonas de disponibilidade" },
      { id: "b", text: "Mantém uma réplica síncrona em outra zona e faz failover automático" },
      { id: "c", text: "Cria um snapshot diário e o restaura manualmente em caso de falha" },
      { id: "d", text: "Distribui as escritas entre duas instâncias primárias" },
    ];
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [answer, setAnswer] = useState<QuestionCardProps["answer"]>();
    const [confidence, setConfidence] = useState<Confidence>();
    const [done, setDone] = useState(false);
    const letters = ["A", "B", "C", "D"];
    const picked = answer?.pickedId ?? null;
    const outcome = picked === null ? "dontknow" : picked === "b" ? "correct" : "wrong";
    const reset = () => {
      setSelectedId(null);
      setAnswer(undefined);
      setConfidence(undefined);
    };
    if (done) return <p>Fim da Rodada. <button onClick={() => { setDone(false); reset(); }}>Recomeçar</button></p>;
    return (
      <QuestionCard
        topic="Alta disponibilidade e recuperação de desastres"
        position={{ current: 8, total: 20 }}
        prompt="Um banco de dados relacional precisa sobreviver à queda de uma zona sem perder transações confirmadas. Qual configuração atende a esse requisito?"
        alternatives={alternatives}
        selectedId={selectedId}
        onSelect={setSelectedId}
        answer={answer}
        onSubmit={() => setAnswer({ pickedId: selectedId, correctId: "b" })}
        onDontKnow={() => setAnswer({ pickedId: null, correctId: "b" })}
        footer={
          answer && (
            <CorrectionPanel
              autoFocus
              outcome={outcome}
              explanations={explanations.map((e) => ({
                ...e,
                picked: e.letter === letters[alternatives.findIndex((a) => a.id === picked)],
              }))}
              references={refs}
              confidence={confidence}
              onConfidenceChange={setConfidence}
              onContest={() => {}}
              onNext={() => setDone(true)}
            />
          )
        }
      />
    );
  },
};
