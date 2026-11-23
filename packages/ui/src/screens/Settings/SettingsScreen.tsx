import { useState } from "react";
import { CloudOff } from "lucide-react";
import { AppShell } from "../../components/AppShell/AppShell";
import { Button } from "../../components/Button/Button";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { ParameterField } from "../../components/Settings/ParameterField";
import { PriceTable, type PriceField, type PriceRow } from "../../components/Settings/PriceTable";
import { StageModelSelect } from "../../components/Settings/StageModelSelect";
import { Skeleton, SkeletonGroup } from "../../components/Skeleton/Skeleton";
import "./SettingsScreen.css";

export const MODELS = [
  { value: "fable", label: "Fable 5.2", description: "US$ 15 de entrada, 75 de saída" },
  { value: "opus", label: "Opus 5.5", description: "US$ 5 de entrada, 25 de saída" },
  { value: "sonnet", label: "Sonnet 5.5", description: "US$ 3 de entrada, 15 de saída" },
  { value: "haiku", label: "Haiku 5.5", description: "US$ 1 de entrada, 5 de saída" },
];

export const STAGES = [
  { id: "topics", label: "Extração de Tópicos", description: "Propõe os Tópicos a partir do Objetivo e das Fontes." },
  { id: "chunks", label: "Classificação de Trechos", description: "Liga cada Trecho de uma Fonte a um Tópico." },
  { id: "generate", label: "Geração de Perguntas", description: "Escreve as Perguntas, Alternativas e Explicações." },
  { id: "blind", label: "Resolução às cegas", description: "Responde a Pergunta sem ver o Gabarito, para conferi-lo." },
  { id: "contest", label: "Julgamento de Contestação", description: "Decide se a Contestação procede." },
];

export const PARAMETERS = [
  {
    id: "window",
    label: "Janela de Respostas recentes",
    description: "Quantas Respostas recentes de cada Tópico entram no cálculo do Desempenho.",
    min: 1,
    max: 100,
    defaultValue: 10,
    unit: "Respostas",
  },
  {
    id: "minWeight",
    label: "Peso mínimo dos Tópicos fortes",
    description: "Chance mínima de sorteio de todo Tópico ativo, mesmo os que você já domina.",
    min: 0,
    max: 50,
    defaultValue: 10,
    unit: "%",
  },
  {
    id: "reviewFraction",
    label: "Fração de Revisão",
    description: "O máximo de cada Rodada que as Revisões vencidas podem ocupar.",
    min: 0,
    max: 100,
    defaultValue: 30,
    unit: "%",
  },
  {
    id: "existingLimit",
    label: "Perguntas existentes enviadas na geração",
    description: "Quantos enunciados já existentes do Tópico o Claude vê, para cobrir outros aspectos.",
    min: 0,
    max: 200,
    defaultValue: 50,
    unit: "Perguntas",
  },
  {
    id: "similarity",
    label: "Limiar de semelhança de duplicadas",
    description: "Perguntas novas mais parecidas que isso com uma existente são descartadas e geradas de novo.",
    min: 50,
    max: 100,
    defaultValue: 90,
    unit: "%",
  },
];

export const PRICES: PriceRow[] = [
  { id: "fable", model: "Fable 5.2", input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  { id: "opus", model: "Opus 5.5", input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  { id: "sonnet", model: "Sonnet 5.5", input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  { id: "haiku", model: "Haiku 5.5", input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
];

export interface SettingsScreenProps {
  /** `loading`: primeira carga. `error`: as Configurações não carregaram. */
  status?: "ready" | "loading" | "error";
  /** Valores iniciais dos parâmetros por id; o que faltar usa o padrão. */
  initialParams?: Record<string, number | null>;
  initialModels?: Record<string, string>;
  initialPrices?: PriceRow[];
  /** Etapa gravando ou com erro de gravação. */
  stageSaving?: string;
  stageError?: Record<string, string>;
  priceSavingId?: string;
  priceErrors?: Record<string, string>;
  paramSavingId?: string;
  paramErrors?: Record<string, string>;
  /** Só para o Storybook: mostra o erro de faixa sem precisar sair do campo. */
  showRangeErrors?: boolean;
  onRetry?: () => void;
  /** Como o app acessa o Claude hoje, com a ação de trocar o Método de acesso ou renovar a Credencial (ticket 23). */
  access?: { summary: string; onOpen: () => void };
  /** O usuário escolheu outro modelo para uma Etapa. */
  onStageModelChange?: (stageId: string, modelId: string) => void;
  /** O usuário terminou de editar uma linha da tabela de preços, com os quatro valores preenchidos. */
  onPriceSave?: (row: PriceRow & Record<PriceField, number>) => void;
}

/** Tickets 19 e 21: modelo por Etapa, tabela de preços e parâmetros do motor. */
export function SettingsScreen({
  status = "ready",
  initialParams = {},
  initialModels = {},
  initialPrices = PRICES,
  stageSaving,
  stageError,
  priceSavingId,
  priceErrors,
  paramSavingId,
  paramErrors,
  showRangeErrors,
  onRetry,
  access,
  onStageModelChange,
  onPriceSave,
}: SettingsScreenProps) {
  const [models, setModels] = useState<Record<string, string>>(() =>
    Object.fromEntries(STAGES.map((s) => [s.id, initialModels[s.id] ?? "sonnet"])),
  );
  const [prices, setPrices] = useState(initialPrices);
  const [params, setParams] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(PARAMETERS.map((p) => [p.id, initialParams[p.id] !== undefined ? initialParams[p.id] : p.defaultValue])),
  );

  const header = <PageHeader title="Configurações" description="Valem para todos os Estudos." />;

  if (status === "error") {
    return (
      <AppShell current="settings" width="content">
        {header}
        <EmptyState
          tone="danger"
          icon={<CloudOff size={28} />}
          title="Não foi possível carregar as Configurações"
          action={
            <Button variant="secondary" onClick={onRetry}>
              Tentar de novo
            </Button>
          }
        >
          Tente de novo. Nada foi alterado.
        </EmptyState>
      </AppShell>
    );
  }

  const loading = status === "loading";

  return (
    <AppShell current="settings" width="content">
      {header}

      {access && (
        <section className="settings__section" aria-label="Acesso ao Claude">
          <PageHeader
            level="section"
            title="Acesso ao Claude"
            description={access.summary}
            actions={
              <Button variant="secondary" onClick={access.onOpen}>
                Trocar ou renovar
              </Button>
            }
          />
        </section>
      )}

      <section className="settings__section" aria-label="Modelo por Etapa">
        <PageHeader
          level="section"
          title="Modelo por Etapa"
          description="Todas as Etapas começam no Sonnet 5.5. Troque o modelo de uma Etapa para equilibrar qualidade e custo."
        />
        {loading ? (
          <SkeletonGroup label="Carregando modelos">
            <div className="settings__list">
              {STAGES.map((s) => (
                <Skeleton key={s.id} shape="block" height={96} />
              ))}
            </div>
          </SkeletonGroup>
        ) : (
          <div className="settings__list">
            {STAGES.map((s) => (
              <StageModelSelect
                key={s.id}
                stage={s.label}
                description={s.description}
                options={MODELS}
                value={models[s.id]}
                defaultValue="sonnet"
                onValueChange={(v) => {
                  setModels((cur) => ({ ...cur, [s.id]: v }));
                  onStageModelChange?.(s.id, v);
                }}
                saving={stageSaving === s.id}
                error={stageError?.[s.id]}
              />
            ))}
          </div>
        )}
      </section>

      <section className="settings__section" aria-label="Preços por modelo">
        <PageHeader
          level="section"
          title="Preços por modelo"
          description="Usados para estimar o custo nas Métricas. Valores em US$ por 1 milhão de tokens."
        />
        <PriceTable
          rows={prices}
          loading={loading}
          savingId={priceSavingId}
          errors={priceErrors}
          onChange={(id, field: PriceField, value) =>
            setPrices((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
          }
          onCommit={(id) => {
            const row = prices.find((r) => r.id === id);
            if (row && row.input != null && row.output != null && row.cacheRead != null && row.cacheWrite != null) {
              onPriceSave?.({ ...row, input: row.input, output: row.output, cacheRead: row.cacheRead, cacheWrite: row.cacheWrite });
            }
          }}
        />
      </section>

      <section className="settings__section" aria-label="Parâmetros do motor">
        <PageHeader
          level="section"
          title="Parâmetros do motor"
          description="Calibram o Desempenho, o sorteio e a composição da Rodada. Cada valor tem uma faixa válida."
        />
        {loading ? (
          <SkeletonGroup label="Carregando parâmetros">
            <div className="settings__list">
              {PARAMETERS.map((p) => (
                <Skeleton key={p.id} shape="block" height={112} />
              ))}
            </div>
          </SkeletonGroup>
        ) : (
          <div className="settings__list">
            {PARAMETERS.map((p) => (
              <ParameterField
                key={p.id}
                label={p.label}
                description={p.description}
                min={p.min}
                max={p.max}
                defaultValue={p.defaultValue}
                unit={p.unit}
                value={params[p.id]}
                onChange={(v) => setParams((cur) => ({ ...cur, [p.id]: v }))}
                saving={paramSavingId === p.id}
                error={paramErrors?.[p.id]}
                forceTouched={showRangeErrors}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
