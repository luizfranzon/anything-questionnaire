import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReviewItem } from "../../components/ReviewList/ReviewList";
import { RoundDetailScreen } from "./RoundDetailScreen";

const alts = [
  { id: "A", text: "Réplicas de leitura em outra região" },
  { id: "B", text: "Réplica síncrona em outra zona com failover automático" },
  { id: "C", text: "Snapshot diário com restauração manual" },
  { id: "D", text: "Duas instâncias primárias aceitando escrita" },
];

const explanations = (picked: string | null) => [
  {
    letter: "B",
    correct: true,
    picked: picked === "B",
    why: "Uma réplica síncrona confirma cada transação nas duas cópias antes de responder, então nenhuma transação confirmada se perde.",
  },
  { letter: "A", picked: picked === "A", why: "Réplicas de leitura são assíncronas e não participam do failover de escrita." },
  { letter: "C", picked: picked === "C", why: "Um snapshot diário deixa até 24 horas de transações sem proteção." },
  { letter: "D", picked: picked === "D", why: "Duas primárias exigem resolução de conflitos e não garantem a transação nas duas." },
];

const refs = [{ source: "Guia de alta disponibilidade.pdf", location: "p. 14" }];

const base = (id: number, picked: string | null, over: Partial<ReviewItem> = {}): ReviewItem => ({
  id: String(id),
  position: id,
  topic: id % 2 ? "Replicação e failover" : "Backup e restauração",
  prompt:
    id === 3
      ? "Uma empresa precisa garantir que o banco de dados de pedidos continue disponível, sem perda de transações confirmadas, quando uma zona de disponibilidade inteira ficar indisponível, e ainda assim manter o custo operacional baixo. Qual abordagem atende melhor a esse requisito?"
      : "Qual configuração garante que nenhuma transação confirmada seja perdida se a zona primária cair?",
  alternatives: alts,
  pickedId: picked,
  correctId: "B",
  confidence: picked === null ? undefined : id % 3 === 0 ? "duvida" : "certeza",
  explanations: explanations(picked),
  references: refs,
  ...over,
});

const items: ReviewItem[] = [
  base(1, "B"),
  base(2, "C", { contestation: { status: "pending" } }),
  base(3, "A"),
  base(4, null),
  base(5, "B", {
    divergence: "A Fonte diz que réplicas assíncronas bastam, mas isso não evita perda de transações.",
  }),
  base(6, "D", { references: [] }),
  base(7, "B", { voided: true, explanations: [] }),
  base(8, "C", {
    contestation: {
      status: "kept",
      justification: "A resolução às cegas chegou à mesma Alternativa e a Explicação cita a documentação do serviço.",
    },
  }),
];

const many = Array.from({ length: 40 }, (_, i) => base(i + 1, ["B", "A", "C", null, "B"][i % 5]));

const meta = {
  title: "Telas/Detalhe de Rodada passada",
  component: RoundDetailScreen,
  parameters: { layout: "fullscreen" },
  args: { studyName: "Certificação AWS Solutions Architect", date: "22/11", mode: "mock", items },
} satisfies Meta<typeof RoundDetailScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SimuladoCompleto: Story = {};
export const SimuladoComLinhaAberta: Story = { args: { initial: { expanded: ["2"] } } };
export const ModoEstudo: Story = { args: { mode: "study" } };
export const Encerrada: Story = { args: { items: items.slice(0, 4), roundTotal: 20 } };
export const MuitasPerguntas: Story = { args: { items: many } };
export const UmaPergunta: Story = { args: { items: items.slice(0, 1), mode: "study" } };
export const Carregando: Story = { args: { status: "loading", items: [] } };
export const NaoCarregou: Story = { args: { status: "error", items: [] } };
export const AbrindoTrecho: Story = { args: { initial: { excerpt: "ready", expanded: ["1"] } } };
export const TrechoFonteRemovida: Story = { args: { initial: { excerpt: "unavailable", expanded: ["1"] } } };
export const ContestandoUmaPergunta: Story = { args: { initial: { contestItem: "3", expanded: ["3"] } } };
