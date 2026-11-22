import { useState, type ReactNode } from "react";
import { Flag } from "lucide-react";
import { Button } from "../Button/Button";
import { Dialog } from "../Dialog/Dialog";
import { InlineAlert } from "../InlineAlert/InlineAlert";
import { Textarea } from "../Textarea/Textarea";
import "./Contestation.css";

export const CONTESTATION_MAX_LENGTH = 1000;

export const CONTESTATION_DESCRIPTION =
  "Explique por que o Gabarito está errado. A reavaliação pesa o seu argumento contra a Explicação original.";

export interface ContestationFormProps {
  open: boolean;
  onClose: () => void;
  /** Recebe o argumento sem espaços nas pontas. */
  onSubmit: (argument: string) => void;
  /** A Pergunta contestada, para a pessoa saber o que está contestando. */
  prompt?: ReactNode;
  /** Letra do Gabarito atual: "B". */
  gabarito?: string;
  /** Gravando. Mantém o tamanho do botão e nada fecha. */
  submitting?: boolean;
  /** Falha ao gravar. Aparece no diálogo, que continua aberto com o texto. */
  error?: ReactNode;
}

/** A Pergunta contestada, em resumo. */
export function ContestedQuestion({ prompt, gabarito }: { prompt: ReactNode; gabarito?: string }) {
  return (
    <div className="contest__question">
      <p className="contest__question-label">
        Pergunta{gabarito && <span> · Gabarito atual: {gabarito}</span>}
      </p>
      <p className="contest__question-text">{prompt}</p>
    </div>
  );
}

/** Os botões do diálogo, compartilhados com a matriz do Storybook. */
export function ContestationActions({
  onCancel,
  onSubmit,
  submitting,
  empty,
}: {
  onCancel?: () => void;
  onSubmit?: () => void;
  submitting?: boolean;
  empty: boolean;
}) {
  return (
    <>
      <Button variant="secondary" onClick={onCancel} disabled={submitting}>
        Cancelar
      </Button>
      <Button icon={<Flag size={18} aria-hidden />} loading={submitting} disabled={empty} onClick={onSubmit}>
        Contestar
      </Button>
    </>
  );
}

/** Contestar o Gabarito de uma Pergunta. Modal sobre `Dialog`; o texto some ao fechar. */
export function ContestationForm({ open, onClose, onSubmit, prompt, gabarito, submitting, error }: ContestationFormProps) {
  const [text, setText] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  // Cada abertura começa em branco; uma falha ao gravar mantém o texto.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setText("");
  }
  const argument = text.trim();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={submitting}
      size="sm"
      title="Contestar o Gabarito"
      description={CONTESTATION_DESCRIPTION}
      footer={
        <ContestationActions
          onCancel={onClose}
          onSubmit={() => onSubmit(argument)}
          submitting={submitting}
          empty={argument.length === 0}
        />
      }
    >
      {prompt && <ContestedQuestion prompt={prompt} gabarito={gabarito} />}
      <Textarea
        label="Seu argumento"
        placeholder="Ex.: a Alternativa C também está certa porque…"
        minRows={4}
        maxRows={8}
        maxLength={CONTESTATION_MAX_LENGTH}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={submitting}
        autoFocus
      />
      {error && <InlineAlert tone="danger">{error}</InlineAlert>}
    </Dialog>
  );
}
