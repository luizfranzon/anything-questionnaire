import type { ReactNode } from "react";
import { Button } from "../Button/Button";
import { Dialog } from "../Dialog/Dialog";
import { InlineAlert } from "../InlineAlert/InlineAlert";

export interface ConfirmDialogProps {
  open: boolean;
  /** Cancelar, Esc, clique fora e X. */
  onClose: () => void;
  onConfirm: () => void;
  /** Pergunta curta: "Excluir o Estudo Redes?". */
  title: string;
  /** A consequência, em uma ou duas frases: o que some e se dá para desfazer. */
  children: ReactNode;
  /** Verbo da ação, igual ao do botão que abriu o diálogo: "Excluir Estudo", "Remover Fonte". */
  confirmLabel: string;
  cancelLabel?: string;
  /** `destructive` (berry) para o que apaga; `default` (menta) para o resto. */
  tone?: "destructive" | "default";
  confirmIcon?: ReactNode;
  /** A ação está gravando: o botão mostra o spinner e nada fecha. */
  loading?: boolean;
  /** Falha ao gravar. Aparece no diálogo, que continua aberto para tentar de novo. */
  error?: ReactNode;
}

/** Confirmação de uma ação. O foco inicial fica em Cancelar, nunca na ação destrutiva. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancelar",
  tone = "destructive",
  confirmIcon,
  loading,
  error,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={loading}
      title={title}
      description={children}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading} autoFocus>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "destructive" ? "destructive" : "primary"}
            icon={confirmIcon}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {error && <InlineAlert tone="danger">{error}</InlineAlert>}
    </Dialog>
  );
}
