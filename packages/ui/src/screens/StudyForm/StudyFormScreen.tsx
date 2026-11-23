import { useState } from "react";
import { AppShell } from "../../components/AppShell/AppShell";
import { Button } from "../../components/Button/Button";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { InlineAlert } from "../../components/InlineAlert/InlineAlert";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { Skeleton, SkeletonGroup } from "../../components/Skeleton/Skeleton";
import { TextInput } from "../../components/TextInput/TextInput";
import { Textarea } from "../../components/Textarea/Textarea";
import { CloudOff } from "lucide-react";
import "./StudyFormScreen.css";

export const NAME_MAX = 120;
export const GOAL_MAX = 600;

export interface StudyFormValues {
  name: string;
  goal: string;
}

export interface StudyFormScreenProps {
  /** `create`: Estudo novo. `edit`: ajusta nome e Objetivo de um Estudo existente. */
  mode: "create" | "edit";
  initial?: StudyFormValues;
  /** `loading` e `error` só existem em `edit`, quando o Estudo ainda vai chegar. */
  status?: "ready" | "loading" | "error";
  saving?: boolean;
  /** Falha ao gravar. O formulário continua com o que foi digitado. */
  saveError?: string;
  onSubmit?: (values: StudyFormValues) => void;
  onCancel?: () => void;
  /** Voltar para a lista; se omitido, usa onCancel. */
  onBack?: () => void;
  onRetry?: () => void;
  /** Só para o Storybook: mostra os erros de validação sem precisar interagir. */
  showErrors?: boolean;
}

function validate({ name, goal }: StudyFormValues) {
  return {
    name: !name.trim() ? "Dê um nome ao Estudo." : name.length > NAME_MAX ? `Use até ${NAME_MAX} caracteres.` : undefined,
    goal: !goal.trim()
      ? "Descreva o Objetivo para o Claude propor os Tópicos."
      : goal.length > GOAL_MAX
        ? `Use até ${GOAL_MAX} caracteres.`
        : undefined,
  };
}

/** Ticket 01: criar e editar um Estudo só com nome e Objetivo. */
export function StudyFormScreen({
  mode,
  initial = { name: "", goal: "" },
  status = "ready",
  saving,
  saveError,
  onSubmit,
  onCancel,
  onBack = onCancel,
  onRetry,
  showErrors,
}: StudyFormScreenProps) {
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState<{ name?: boolean; goal?: boolean }>(
    showErrors ? { name: true, goal: true } : {},
  );
  const errors = validate(values);
  const create = mode === "create";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, goal: true });
    if (errors.name || errors.goal) return;
    onSubmit?.({ name: values.name.trim(), goal: values.goal.trim() });
  };

  return (
    <AppShell current="studies" width="reading">
      <PageHeader
        back={{ label: "Estudos", href: "#/estudos", onClick: onBack }}
        title={create ? "Novo Estudo" : "Editar Estudo"}
        description={
          create
            ? "Um Estudo começa com um Objetivo. As Fontes você adiciona depois, se tiver material."
            : undefined
        }
        loading={status === "loading"}
      />

      {status === "error" && (
        <EmptyState
          tone="danger"
          size="compact"
          icon={<CloudOff size={28} />}
          title="Não foi possível carregar o Estudo"
          action={
            <Button variant="secondary" onClick={onRetry}>
              Tentar de novo
            </Button>
          }
        >
          Tente de novo ou volte para a lista de Estudos.
        </EmptyState>
      )}

      {status === "loading" && (
        <SkeletonGroup label="Carregando o Estudo">
          <div className="study-form">
            <Skeleton shape="block" height={76} />
            <Skeleton shape="block" height={132} />
          </div>
        </SkeletonGroup>
      )}

      {status === "ready" && (
        <form className="study-form" onSubmit={submit} noValidate>
          {saveError && (
            <InlineAlert tone="danger" title="Não foi possível gravar o Estudo">
              {saveError}
            </InlineAlert>
          )}
          <TextInput
            label="Nome"
            value={values.name}
            maxLength={NAME_MAX}
            placeholder="Ex.: Certificação AWS Solutions Architect"
            disabled={saving}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            error={touched.name ? errors.name : undefined}
            help="Como o Estudo aparece na lista."
          />
          <Textarea
            label="Objetivo"
            value={values.goal}
            maxLength={GOAL_MAX}
            minRows={4}
            placeholder="Ex.: Passar na prova SAA-C03 em março, com foco em redes e custo."
            disabled={saving}
            onChange={(e) => setValues((v) => ({ ...v, goal: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, goal: true }))}
            error={touched.goal ? errors.goal : undefined}
            help="O Claude usa o Objetivo para propor os Tópicos."
          />
          <div className="study-form__actions">
            <Button variant="secondary" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {create ? "Criar Estudo" : "Salvar alterações"}
            </Button>
          </div>
        </form>
      )}
    </AppShell>
  );
}
