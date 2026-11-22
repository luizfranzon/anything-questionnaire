import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ParameterField } from "./ParameterField";
import { PriceTable, type PriceField, type PriceRow } from "./PriceTable";
import { StageModelSelect } from "./StageModelSelect";

const models = [
  { value: "fable", label: "Fable 5.2", description: "US$ 15 de entrada, 75 de saída" },
  { value: "opus", label: "Opus 5.5", description: "US$ 5 de entrada, 25 de saída" },
  { value: "sonnet", label: "Sonnet 5.5", description: "US$ 3 de entrada, 15 de saída" },
  { value: "haiku", label: "Haiku 5.5", description: "US$ 1 de entrada, 5 de saída" },
];

const stages = [
  { id: "topics", label: "Extração de Tópicos", description: "Propõe os Tópicos a partir do Objetivo e das Fontes." },
  { id: "chunks", label: "Classificação de Trechos", description: "Liga cada Trecho de uma Fonte a um Tópico." },
  { id: "generate", label: "Geração de Perguntas", description: "Escreve as Perguntas, Alternativas e Explicações." },
  { id: "blind", label: "Resolução às cegas", description: "Responde a Pergunta sem ver o Gabarito, para conferi-lo." },
  { id: "contest", label: "Julgamento de Contestação", description: "Decide se a Contestação procede." },
];

const caption: React.CSSProperties = { font: "600 13px/18px var(--font-sans)", color: "var(--color-text-muted)", marginBottom: 8 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2, 420px)", gap: "var(--space-6) var(--space-7)", alignItems: "start" };

const meta = {
  title: "Componentes/Configurações",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/* ---------- StageModelSelect ---------- */

/** Como a tela usa: uma linha por Etapa, tudo em Opus 5.5 até o usuário trocar. */
export const ModeloPorEtapa: Story = {
  render: function Render() {
    const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(stages.map((s) => [s.id, "opus"])));
    return (
      <div style={{ display: "grid", gap: "var(--space-3)", minHeight: 640 }}>
        {stages.map((s) => (
          <StageModelSelect
            key={s.id}
            stage={s.label}
            description={s.description}
            options={models}
            value={values[s.id]}
            defaultValue="opus"
            onValueChange={(v) => setValues((cur) => ({ ...cur, [s.id]: v }))}
          />
        ))}
      </div>
    );
  },
};

/** Matriz de estados de uma linha. */
export const ModeloEstados: Story = {
  render: () => {
    const base = { stage: "Geração de Perguntas", description: stages[2].description, options: models, defaultValue: "opus", onValueChange: () => {} };
    return (
      <div style={grid}>
        <div>
          <div style={caption}>Padrão</div>
          <StageModelSelect {...base} value="opus" />
        </div>
        <div>
          <div style={caption}>Alterado, com "Restaurar"</div>
          <StageModelSelect {...base} value="haiku" />
        </div>
        <div>
          <div style={caption}>Gravando</div>
          <StageModelSelect {...base} value="sonnet" saving />
        </div>
        <div>
          <div style={caption}>Não gravou</div>
          <StageModelSelect {...base} value="sonnet" error="Não foi possível gravar. Escolha o modelo de novo." />
        </div>
        <div>
          <div style={caption}>Desabilitado</div>
          <StageModelSelect {...base} value="opus" disabled />
        </div>
      </div>
    );
  },
};

/* ---------- PriceTable ---------- */

const prices: PriceRow[] = [
  { id: "fable", model: "Fable 5.2", input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  { id: "opus", model: "Opus 5.5", input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  { id: "sonnet", model: "Sonnet 5.5", input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  { id: "haiku", model: "Haiku 5.5", input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
];

export const TabelaDePrecos: Story = {
  render: function Render() {
    const [rows, setRows] = useState(prices);
    const change = (id: string, field: PriceField, value: number | null) =>
      setRows((cur) => cur.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    return <PriceTable rows={rows} onChange={change} />;
  },
};
export const PrecosCarregando: Story = { render: () => <PriceTable rows={[]} loading onChange={() => {}} /> };
export const PrecosVazia: Story = { render: () => <PriceTable rows={[]} onChange={() => {}} /> };
export const PrecosGravando: Story = { render: () => <PriceTable rows={prices} savingId="opus" onChange={() => {}} /> };
export const PrecosErroAoGravar: Story = {
  render: () => <PriceTable rows={prices} errors={{ opus: "Não foi possível gravar. Edite o valor de novo." }} onChange={() => {}} />,
};
/** Campo apagado e abandonado: borda berry e frase embaixo. */
export const PrecosCampoVazio: Story = {
  render: function Render() {
    const [rows, setRows] = useState<PriceRow[]>(prices.map((r) => (r.id === "sonnet" ? { ...r, cacheRead: null } : r)));
    return (
      <PriceTable
        rows={rows}
        onChange={(id, f, v) => setRows((cur) => cur.map((r) => (r.id === id ? { ...r, [f]: v } : r)))}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[aria-label="Leitura de cache, Sonnet 5.5"]');
    input?.focus();
    input?.blur();
  },
};
export const PrecosSomenteLeitura: Story = { render: () => <PriceTable rows={prices} readOnly onChange={() => {}} /> };

/* ---------- ParameterField ---------- */

function Param({ initial, ...rest }: { initial: number | null } & Partial<React.ComponentProps<typeof ParameterField>>) {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <ParameterField
      label="Janela de Respostas recentes"
      description="Quantas Respostas entram no Desempenho de um Tópico."
      min={5}
      max={100}
      defaultValue={20}
      unit="Respostas"
      {...rest}
      value={value}
      onChange={setValue}
    />
  );
}

export const Parametros: Story = {
  render: function Render() {
    return (
      <div style={{ display: "grid", gap: "var(--space-4)" }}>
        <Param initial={20} />
        <Param
          initial={0.1}
          label="Peso mínimo dos Tópicos fortes"
          description="Chance mínima de um Tópico forte aparecer na Rodada."
          min={0}
          max={1}
          step={0.05}
          defaultValue={0.1}
          unit={undefined}
        />
        <Param
          initial={25}
          label="Fração de Revisão da Rodada"
          description="Quanto da Rodada vem de Perguntas em Revisão."
          min={0}
          max={100}
          step={5}
          defaultValue={25}
          unit="%"
        />
        <Param
          initial={200}
          label="Enunciados enviados na geração"
          description="Limite de enunciados existentes enviados ao Claude para evitar repetição."
          min={0}
          max={1000}
          step={10}
          defaultValue={200}
          unit="enunciados"
        />
        <Param
          initial={0.85}
          label="Limiar de semelhança de duplicadas"
          description="Acima deste valor, uma Pergunta nova é descartada como repetida."
          min={0.5}
          max={1}
          step={0.01}
          defaultValue={0.85}
        />
      </div>
    );
  },
};

export const ParametroEstados: Story = {
  render: () => (
    <div style={grid}>
      <div>
        <div style={caption}>Padrão</div>
        <Param initial={20} />
      </div>
      <div>
        <div style={caption}>Alterado, com "Restaurar"</div>
        <Param initial={40} />
      </div>
      <div>
        <div style={caption}>Fora da faixa</div>
        <Param initial={3} forceTouched />
      </div>
      <div>
        <div style={caption}>Campo vazio</div>
        <Param initial={null} />
      </div>
      <div>
        <div style={caption}>Gravando</div>
        <Param initial={40} saving />
      </div>
      <div>
        <div style={caption}>Não gravou</div>
        <Param initial={40} error="Não foi possível gravar. Tente de novo." />
      </div>
      <div>
        <div style={caption}>Desabilitado</div>
        <Param initial={20} disabled />
      </div>
    </div>
  ),
};
