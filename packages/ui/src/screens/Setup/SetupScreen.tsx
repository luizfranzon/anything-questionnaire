import { useState, type FormEvent } from "react";
import { AppShell } from "../../components/AppShell/AppShell";
import { Button } from "../../components/Button/Button";
import { InlineAlert } from "../../components/InlineAlert/InlineAlert";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { RadioGroup } from "../../components/RadioGroup/RadioGroup";
import { TextInput } from "../../components/TextInput/TextInput";
import "./SetupScreen.css";

export type AccessMethod = "subscription" | "api-key";

export interface CurrentAccess {
  method: AccessMethod;
  /** O que a interface recebe do segredo: nunca ele inteiro. */
  masked: string;
  /** `environment`: a variável de ambiente está valendo e vence o valor guardado. */
  source: "environment" | "stored";
}

export interface SetupScreenProps {
  /** `first-run`: bloqueia o app até existir uma Credencial válida. `settings`: troca ou renova a que já existe. */
  mode?: "first-run" | "settings";
  current?: CurrentAccess;
  /** Testando o acesso com uma chamada mínima real. */
  validating?: boolean;
  /** Por que a validação falhou, com o que fazer. */
  error?: string;
  /** Só em `settings`: volta às Configurações. */
  onExit?: () => void;
  onSubmit?: (input: { method: AccessMethod; secret: string }) => void;
}

const METHODS = [
  {
    value: "subscription",
    label: "Assinatura do Claude",
    description: "Usa o seu plano, sem cobrança por token. Tem o limite de uso do plano.",
  },
  {
    value: "api-key",
    label: "Chave de API",
    description: "Cobrança por token, direto na API da Anthropic. Sem limite de plano.",
  },
];

const METHOD_NAME: Record<AccessMethod, string> = { subscription: "Assinatura", "api-key": "Chave de API" };

/** Ticket 23: escolher o Método de acesso, colar a Credencial e só gravá-la depois de uma chamada real. */
export function SetupScreen({ mode = "first-run", current, validating, error, onExit, onSubmit }: SetupScreenProps) {
  const [method, setMethod] = useState<AccessMethod>(current?.method ?? "subscription");
  const [secret, setSecret] = useState("");
  const first = mode === "first-run";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!validating && secret.trim()) onSubmit?.({ method, secret: secret.trim() });
  };

  return (
    <AppShell
      variant="focus"
      width="reading"
      onExit={first ? undefined : onExit}
      exitLabel="Voltar às Configurações"
    >
      <PageHeader
        title={first ? "Conecte o Claude" : "Acesso ao Claude"}
        description={
          first
            ? "Escolha como o app fala com o Claude. Nada funciona antes disso."
            : "Troque o Método de acesso ou renove a Credencial."
        }
      />

      {current?.source === "environment" && (
        <InlineAlert tone="info" title="Uma variável de ambiente está em uso" className="setup__notice">
          {METHOD_NAME[current.method]} ({current.masked}) vem do ambiente e vence o que você salvar aqui. O valor
          salvo só passa a valer quando a variável for removida.
        </InlineAlert>
      )}
      {current?.source === "stored" && (
        <InlineAlert tone="info" title="Em uso agora" className="setup__notice">
          {METHOD_NAME[current.method]} ({current.masked}).
        </InlineAlert>
      )}

      <form className="setup__form" onSubmit={submit} noValidate>
        <RadioGroup
          legend="Como você quer acessar o Claude?"
          variant="card"
          options={METHODS}
          value={method}
          onValueChange={(value) => {
            setMethod(value as AccessMethod);
            setSecret("");
          }}
          disabled={validating}
        />

        {method === "subscription" && (
          <ol className="setup__steps">
            <li>Instale o Claude Code no seu computador.</li>
            <li>
              No terminal, rode <code className="setup__code">claude setup-token</code> e copie o token que ele
              mostrar.
            </li>
            <li>Cole o token abaixo.</li>
          </ol>
        )}

        <TextInput
          label={method === "subscription" ? "Token da assinatura" : "Chave de API"}
          help={
            method === "subscription"
              ? "Começa com sk-ant-oat. Fica cifrado e nunca volta inteiro para esta tela."
              : "Começa com sk-ant-api. Fica cifrada e nunca volta inteira para esta tela."
          }
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          disabled={validating}
        />

        {error && (
          <InlineAlert tone="danger" title="Não foi possível validar o acesso">
            {error}
          </InlineAlert>
        )}

        <div className="setup__actions">
          <Button type="submit" loading={validating} disabled={!secret.trim()}>
            {validating ? "Testando o acesso" : "Validar e salvar"}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
