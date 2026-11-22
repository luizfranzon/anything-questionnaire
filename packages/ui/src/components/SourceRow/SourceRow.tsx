import { useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import {
  FileText,
  FileUp,
  Globe,
  Image,
  TextCursorInput,
  Video,
  type LucideIcon,
} from "lucide-react";
import { Button } from "../Button/Button";
import { StatusTag } from "../Badge/Badge";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
import { IconButton } from "../IconButton/IconButton";
import { IngestionProgress, type IngestionStep } from "../IngestionProgress/IngestionProgress";
import { InlineAlert } from "../InlineAlert/InlineAlert";
import { RadioGroup } from "../RadioGroup/RadioGroup";
import { Skeleton } from "../Skeleton/Skeleton";
import type { SourceKind } from "../SourceExcerptViewer/SourceExcerptViewer";
import "./SourceRow.css";

export type { SourceKind };

const KIND_ICON: Record<SourceKind, { label: string; icon: LucideIcon }> = {
  text: { label: "Texto", icon: TextCursorInput },
  pdf: { label: "PDF", icon: FileText },
  image: { label: "Imagem", icon: Image },
  docx: { label: "DOCX", icon: FileUp },
  site: { label: "Site", icon: Globe },
  youtube: { label: "YouTube", icon: Video },
};

/** O que fazer com as Perguntas que a Fonte originou (ticket 15). */
export type RemoveChoice = "keep" | "archive";

export interface SourceRowProps {
  kind: SourceKind;
  /** Nome do arquivo, título ou URL. Trunca em uma linha; o nome inteiro fica no `title`. */
  name: string;
  /**
   * - `processing`: na fila ou em andamento (use `steps`).
   * - `ready`: Trechos prontos.
   * - `failed`: o processamento falhou (use `error`).
   * - `loading`: esqueleto, enquanto a lista carrega.
   */
  status: "processing" | "ready" | "failed" | "loading";
  /** Etapas do processamento, só em `processing`. */
  steps?: IngestionStep[];
  /** Trechos gerados, só em `ready`. */
  excerptCount?: number;
  /** Onde os Trechos estão: "12 páginas", "42 min". */
  extent?: string;
  /** Só em `failed`: o motivo, em uma frase ("Página exige login"). */
  error?: string;
  /** Só em `failed`: o que fazer ("Cole o texto da página como Fonte de texto"). */
  hint?: string;
  /** Tentar de novo o processamento. Sem ele, o botão não aparece. */
  onRetry?: () => void;

  /** Perguntas que a Fonte originou. Maior que 0: a remoção pergunta o que fazer com elas. */
  questionCount?: number;
  /** Chamado com a escolha ao confirmar. Sem ele, a Fonte não tem botão de remover. */
  onRemove?: (choice: RemoveChoice) => void;
  /** Removendo: a linha esmaece e o diálogo mostra o spinner. */
  removing?: boolean;
  /** A remoção falhou. */
  removeError?: string;

  className?: string;
  /** Só para a matriz de estados do Storybook. */
  forceState?: "hover";
}

/** Linha da lista de Fontes de um Estudo. Use dentro de um `ul`. */
export function SourceRow({
  kind,
  name,
  status,
  steps,
  excerptCount,
  extent,
  error,
  hint,
  onRetry,
  questionCount = 0,
  onRemove,
  removing,
  removeError,
  className,
  forceState,
}: SourceRowProps) {
  const [confirming, setConfirming] = useState(false);
  const [choice, setChoice] = useState<RemoveChoice>("keep");
  const classes = ["srow", removing && "srow--removing", className].filter(Boolean).join(" ");

  if (status === "loading") {
    return (
      <li className={classes} aria-hidden>
        <div className="srow__box">
          <Skeleton shape="block" width={40} height={40} />
          <div className="srow__main">
            <Skeleton width="45%" />
            <Skeleton width="25%" />
          </div>
          <Skeleton shape="block" width={88} height={28} />
          <span />
        </div>
      </li>
    );
  }

  const { icon: Icon, label: kindLabel } = KIND_ICON[kind];
  const meta: ReactNode = (
    <>
      {kindLabel}
      {status === "ready" && excerptCount !== undefined && ` · ${excerptCount} ${excerptCount === 1 ? "Trecho" : "Trechos"}`}
      {status === "ready" && extent && ` · ${extent}`}
    </>
  );

  return (
    <li className={classes}>
      <div className="srow__box" data-state={forceState} aria-busy={removing || status === "processing" || undefined}>
        <span className="srow__icon" aria-hidden>
          <Icon size={22} />
        </span>
        <div className="srow__main">
          <span className="srow__name" title={name}>
            {name}
          </span>
          <span className="srow__meta">{meta}</span>
        </div>
        <StatusTag status={status === "processing" ? "processing" : status === "ready" ? "ready" : "failed"} />
        {onRemove ? (
          <IconButton
            tone="danger"
            label={`Remover a Fonte ${name}`}
            icon={<Trash2 size={18} />}
            disabled={removing}
            onClick={() => {
              setChoice("keep");
              setConfirming(true);
            }}
          />
        ) : (
          <span />
        )}

        {status === "processing" && steps && (
          <div className="srow__extra">
            <IngestionProgress compact steps={steps} />
          </div>
        )}

        {status === "failed" && (
          <div className="srow__extra">
            <InlineAlert
              tone="danger"
              title={error ?? "Não foi possível processar a Fonte"}
              action={
                onRetry ? (
                  <Button variant="link" onClick={onRetry}>
                    Tentar de novo
                  </Button>
                ) : undefined
              }
            >
              {hint}
            </InlineAlert>
          </div>
        )}

        {removeError && !confirming && !removing && (
          <div className="srow__extra">
            <InlineAlert
              tone="danger"
              title="Não foi possível remover a Fonte"
              action={
                <Button variant="link" onClick={() => setConfirming(true)}>
                  Tentar de novo
                </Button>
              }
            >
              {removeError}
            </InlineAlert>
          </div>
        )}
      </div>

      {onRemove && (
        <ConfirmDialog
          open={confirming}
          onClose={() => setConfirming(false)}
          onConfirm={() => onRemove(questionCount > 0 ? choice : "keep")}
          title={`Remover ${name}?`}
          confirmLabel="Remover Fonte"
          confirmIcon={<Trash2 size={18} />}
          tone="destructive"
          loading={removing}
          error={removeError}
        >
          <p className="srow__dialog-text">
            Os Trechos e o arquivo guardado serão apagados. Não dá para desfazer.
          </p>
          {questionCount > 0 && (
            <RadioGroup
              legend={`Esta Fonte originou ${questionCount} ${questionCount === 1 ? "Pergunta" : "Perguntas"}. O que fazer com elas?`}
              variant="card"
              value={choice}
              onValueChange={(v) => setChoice(v as RemoveChoice)}
              disabled={removing}
              options={[
                {
                  value: "keep",
                  label: "Manter as Perguntas",
                  description: "Continuam ativas e perdem só o vínculo com os Trechos apagados.",
                },
                {
                  value: "archive",
                  label: "Arquivar as Perguntas",
                  description: "Saem das Rodadas, das Revisões e do Desempenho. O histórico fica.",
                },
              ]}
            />
          )}
        </ConfirmDialog>
      )}
    </li>
  );
}
