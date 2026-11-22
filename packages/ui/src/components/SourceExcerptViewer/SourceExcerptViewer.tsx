import type { ReactNode } from "react";
import { FileText, FileUp, Globe, Image, MapPin, RotateCcw, TextCursorInput, Trash2, TriangleAlert, Video, type LucideIcon } from "lucide-react";
import { Button } from "../Button/Button";
import { Dialog } from "../Dialog/Dialog";
import { Skeleton, SkeletonGroup } from "../Skeleton/Skeleton";
import "./SourceExcerptViewer.css";

export type SourceKind = "text" | "pdf" | "image" | "docx" | "site" | "youtube";

const KINDS: Record<SourceKind, { label: string; icon: LucideIcon }> = {
  text: { label: "Texto", icon: TextCursorInput },
  pdf: { label: "PDF", icon: FileText },
  image: { label: "Imagem", icon: Image },
  docx: { label: "DOCX", icon: FileUp },
  site: { label: "Site", icon: Globe },
  youtube: { label: "YouTube", icon: Video },
};

export interface SourceExcerptViewerProps {
  open: boolean;
  onClose: () => void;
  /** Nome da Fonte: "Guia de alta disponibilidade.pdf". */
  source: string;
  kind?: SourceKind;
  /** Onde o Trecho está na Fonte: "p. 14", "12:40", "seção 3". */
  location?: string;
  /** O texto do Trecho. */
  excerpt?: ReactNode;
  /**
   * - `ready`: mostra o Trecho.
   * - `loading`: esqueleto do tamanho de um Trecho.
   * - `error`: não carregou; "Tentar de novo".
   * - `unavailable`: a Fonte foi removida e o Trecho não existe mais.
   */
  status?: "ready" | "loading" | "error" | "unavailable";
  onRetry?: () => void;
}

type ViewerStatus = NonNullable<SourceExcerptViewerProps["status"]>;

/** Linha com o nome, o tipo e a localização da Fonte. */
export function ExcerptSource({ source, kind, location }: Pick<SourceExcerptViewerProps, "source" | "kind" | "location">) {
  const spec = kind ? KINDS[kind] : undefined;
  const Icon = spec?.icon ?? FileText;
  return (
    <span className="excerpt__source">
      <Icon size={18} aria-hidden />
      <span className="excerpt__name">{source}</span>
      {spec && <span className="excerpt__kind">{spec.label}</span>}
      {location && (
        <span className="excerpt__location">
          <MapPin size={16} aria-hidden />
          {location}
        </span>
      )}
    </span>
  );
}

/** O miolo do diálogo, por situação. */
export function ExcerptBody({ status, excerpt, onRetry }: { status: ViewerStatus; excerpt?: ReactNode; onRetry?: () => void }) {
  if (status === "ready")
    return (
      <blockquote className="excerpt__text" tabIndex={0} aria-label="Texto do Trecho">
        {excerpt}
      </blockquote>
    );
  if (status === "loading")
    return (
      <SkeletonGroup label="Carregando o Trecho">
        <div className="excerpt__text excerpt__text--skeleton">
          <Skeleton lines={6} width="100%" />
        </div>
      </SkeletonGroup>
    );
  if (status === "error")
    return (
      <div className="excerpt__notice excerpt__notice--danger" role="alert">
        <TriangleAlert size={24} aria-hidden />
        <p className="excerpt__notice-title">Não foi possível carregar o Trecho</p>
        <p className="excerpt__notice-text">Verifique a conexão e tente de novo.</p>
        <Button variant="secondary" icon={<RotateCcw size={18} aria-hidden />} onClick={onRetry}>
          Tentar de novo
        </Button>
      </div>
    );
  return (
    <div className="excerpt__notice" role="status">
      <Trash2 size={24} aria-hidden />
      <p className="excerpt__notice-title">Este Trecho não existe mais</p>
      <p className="excerpt__notice-text">A Fonte foi removida. A Explicação da Pergunta continua valendo.</p>
    </div>
  );
}

/** Abre o Trecho de origem de uma Explicação. Modal sobre `Dialog`, só leitura. */
export function SourceExcerptViewer({
  open,
  onClose,
  source,
  kind,
  location,
  excerpt,
  status = "ready",
  onRetry,
}: SourceExcerptViewerProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="md"
      title="Trecho de origem"
      description={<ExcerptSource source={source} kind={kind} location={location} />}
      footer={
        <Button variant="secondary" onClick={onClose} autoFocus>
          Fechar
        </Button>
      }
    >
      <ExcerptBody status={status} excerpt={excerpt} onRetry={onRetry} />
    </Dialog>
  );
}
