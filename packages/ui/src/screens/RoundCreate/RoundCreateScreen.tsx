import { useState } from "react";
import { CloudOff, Layers, Play } from "lucide-react";
import { AppShell } from "../../components/AppShell/AppShell";
import { Button } from "../../components/Button/Button";
import { Checkbox } from "../../components/Checkbox/Checkbox";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { InlineAlert } from "../../components/InlineAlert/InlineAlert";
import { NumberInput } from "../../components/NumberInput/NumberInput";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { ProgressBar } from "../../components/ProgressBar/ProgressBar";
import { RadioGroup } from "../../components/RadioGroup/RadioGroup";
import "./RoundCreateScreen.css";

export interface RoundTopic {
  id: string;
  name: string;
  /** Mostrado como apoio: "Nunca perguntado". */
  hint?: string;
}

export type RoundCreatePhase = "form" | "generating" | "retrying" | "failed" | "ready";

export interface RoundCreateScreenProps {
  studyName: string;
  /** Tópicos ativos. Arquivados não entram. */
  topics: RoundTopic[];
  phase?: RoundCreatePhase;
  /** Rodada em andamento que será encerrada ao criar a nova. */
  roundInProgress?: { done: number; total: number };
  /** Revisões vencidas, que entram primeiro. */
  dueReviews?: number;
  /** Progresso da geração: Perguntas prontas e verificadas. */
  generated?: { done: number; total: number };
  /** Enviando o pedido (botão em carregando). */
  submitting?: boolean;
  submitError?: string;
  initial?: { count: number | null; mode: "study" | "mock"; selected: string[] };
  /** Só para o Storybook: mostra os erros de validação sem interagir. */
  showErrors?: boolean;
  onSubmit?: (v: { count: number; mode: "study" | "mock"; topicIds: string[] }) => void;
  onRetry?: () => void;
  onStart?: () => void;
  onBack?: () => void;
}

export const COUNT_MIN = 1;
export const COUNT_MAX = 100;

/** Tickets 03, 05 e 07: configurar a Rodada e acompanhar a geração. Primária: "Gerar Rodada". */
export function RoundCreateScreen({
  studyName,
  topics,
  phase = "form",
  roundInProgress,
  dueReviews = 0,
  generated,
  submitting,
  submitError,
  initial,
  showErrors,
  onSubmit,
  onRetry,
  onStart,
  onBack,
}: RoundCreateScreenProps) {
  const [count, setCount] = useState<number | null>(initial?.count ?? 20);
  const [mode, setMode] = useState<"study" | "mock">(initial?.mode ?? "study");
  const [selected, setSelected] = useState<string[]>(initial?.selected ?? []);
  const [touched, setTouched] = useState(!!showErrors);

  const all = selected.length === 0;
  const countError =
    count === null || count < COUNT_MIN || count > COUNT_MAX ? `Use de ${COUNT_MIN} a ${COUNT_MAX} Perguntas.` : undefined;

  const toggle = (id: string, on: boolean) => setSelected((l) => (on ? [...l, id] : l.filter((x) => x !== id)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (countError || count === null) return;
    onSubmit?.({ count, mode, topicIds: all ? topics.map((t) => t.id) : selected });
  };

  const header = (
    <PageHeader
      back={onBack ? { label: studyName, onClick: onBack } : { label: studyName, href: "#/estudos/1" }}
      title={phase === "form" ? "Nova Rodada" : "Gerando a Rodada"}
      level="page"
    />
  );

  if (topics.length === 0 && phase === "form") {
    return (
      <AppShell current="studies" width="reading">
        {header}
        <EmptyState icon={<Layers size={28} />} title="Nenhum Tópico ativo" size="compact" outlined>
          Aprove ou reative ao menos um Tópico para criar uma Rodada.
        </EmptyState>
      </AppShell>
    );
  }

  if (phase !== "form") {
    const done = generated?.done ?? 0;
    const total = generated?.total ?? count ?? 20;
    return (
      <AppShell current="studies" width="reading">
        {header}
        <div className="round-create__generation">
          {phase === "retrying" && (
            <InlineAlert tone="warn" title="A geração falhou e está sendo tentada de novo">
              Pode ser um erro passageiro (como sobrecarga do Claude) ou um problema que se repete. Se continuar
              falhando, o motivo exato está nos logs do servidor.
            </InlineAlert>
          )}
          {phase === "failed" && (
            <EmptyState
              tone="danger"
              icon={<CloudOff size={28} />}
              title="Não foi possível gerar a Rodada"
              size="compact"
              action={
                <Button variant="secondary" onClick={onRetry}>
                  Tentar de novo
                </Button>
              }
            >
              Depois de várias tentativas, o Claude não respondeu. Nenhuma Pergunta foi usada.
            </EmptyState>
          )}
          {phase !== "failed" && (
            <ProgressBar
              label={phase === "ready" ? "Rodada pronta" : phase === "retrying" ? "Tentando de novo" : "Gerando Perguntas"}
              value={phase === "ready" ? total : done}
              max={total}
              valueText={`${phase === "ready" ? total : done} de ${total}`}
              status={phase === "ready" ? "success" : "default"}
            />
          )}
          {phase === "generating" && (
            <p className="round-create__note">
              Cada Pergunta é verificada às cegas antes de entrar. Você pode fechar esta aba; a Rodada estará pronta
              quando voltar.
            </p>
          )}
          {phase === "ready" && (
            <div className="round-create__actions">
              <Button icon={<Play size={18} aria-hidden />} onClick={onStart}>
                Começar Rodada
              </Button>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell current="studies" width="reading">
      {header}
      <form className="round-create" onSubmit={submit} noValidate>
        {roundInProgress && (
          <InlineAlert tone="warn" title="Esta Rodada encerra a que está em andamento">
            A Rodada de {roundInProgress.done}/{roundInProgress.total} será encerrada. As Perguntas não respondidas não
            contam como erro e voltam para o Estoque.
          </InlineAlert>
        )}
        {submitError && (
          <InlineAlert tone="danger" title="Não foi possível criar a Rodada">
            {submitError}
          </InlineAlert>
        )}

        <NumberInput
          label="Quantidade de Perguntas"
          value={count}
          onChange={setCount}
          min={COUNT_MIN}
          max={COUNT_MAX}
          step={5}
          unit="Perguntas"
          help={
            dueReviews > 0
              ? `${dueReviews} ${dueReviews === 1 ? "Revisão vencida entra" : "Revisões vencidas entram"} primeiro, até 30% da Rodada. O resto vem do Estoque e de Perguntas novas.`
              : "As Perguntas do Estoque entram antes de gerar Perguntas novas."
          }
          error={touched ? countError : undefined}
          forceTouched={touched}
          disabled={submitting}
        />

        <RadioGroup
          legend="Modo"
          variant="card"
          value={mode}
          onValueChange={(v) => setMode(v as "study" | "mock")}
          disabled={submitting}
          options={[
            { value: "study", label: "Estudo", description: "Você vê a correção e a Explicação depois de cada Resposta." },
            { value: "mock", label: "Simulado", description: "A correção completa só aparece quando a Rodada termina." },
          ]}
        />

        <fieldset className="round-create__topics" disabled={submitting}>
          <legend className="round-create__legend">Tópicos</legend>
          <Checkbox
            label="Todos os Tópicos"
            description={all ? "O sorteio usa todos os Tópicos ativos." : undefined}
            checked={all ? true : selected.length === topics.length ? true : "indeterminate"}
            onCheckedChange={(on) => setSelected(on ? [] : [topics[0].id])}
          />
          <div className="round-create__topic-list">
            {topics.map((t) => (
              <Checkbox
                key={t.id}
                label={t.name}
                description={t.hint}
                checked={!all && selected.includes(t.id)}
                onCheckedChange={(on) => {
                  if (all) setSelected([t.id]);
                  else toggle(t.id, on);
                }}
              />
            ))}
          </div>
        </fieldset>

        <div className="round-create__actions">
          <Button type="submit" loading={submitting}>
            Gerar Rodada
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
