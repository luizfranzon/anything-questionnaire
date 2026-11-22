import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, CircleAlert, File as FileIcon, FileText, Image, Upload } from "lucide-react";
import { transition } from "../../motion";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { CloseButton } from "../CloseButton/CloseButton";
import { InlineAlert } from "../InlineAlert/InlineAlert";
import { ProgressBar } from "../ProgressBar/ProgressBar";
import "./FileDropzone.css";

export type UploadStatus = "uploading" | "done" | "error";

export interface UploadItem {
  id: string;
  name: string;
  /** Tamanho em bytes. */
  size: number;
  status: UploadStatus;
  /** 0 a 100, só em `uploading`. Omitido: progresso desconhecido. */
  progress?: number;
  /** Só em `error`: o motivo, em uma frase ("Falhou ao enviar", "PDF protegido por senha"). */
  error?: string;
}

/** PDF, imagem, DOCX, TXT e MD (tickets 11 e 12). */
export const defaultAccept = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".docx", ".txt", ".md"];
export const defaultMaxSize = 20 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: value < 10 ? 1 : 0 })} ${units[unit]}`;
}

const imageExtensions = [".png", ".jpg", ".jpeg", ".webp"];
const textExtensions = [".pdf", ".docx", ".txt", ".md"];

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot).toLowerCase();
}

function TypeIcon({ name }: { name: string }) {
  const ext = extensionOf(name);
  const Icon = imageExtensions.includes(ext) ? Image : textExtensions.includes(ext) ? FileText : FileIcon;
  return <Icon size={22} aria-hidden />;
}

interface Rejection {
  name: string;
  reason: string;
}

export interface FileDropzoneProps {
  /** Lista de envios, controlada por quem usa. A zona valida tipo e tamanho; o envio é seu. */
  files?: UploadItem[];
  /** Só chega aqui o que passou na validação. */
  onAdd: (files: File[]) => void;
  /** Remover da lista, ou cancelar o envio em andamento. */
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  /** Extensões aceitas, com ponto. */
  accept?: string[];
  /** Em bytes. */
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  /** Texto de apoio sob a chamada. Padrão: tipos e limite. */
  hint?: string;
  /** Só para a matriz de estados do Storybook. */
  forceState?: "hover" | "focus" | "dragover";
}

function defaultHint(accept: string[], maxSize: number): string {
  const same = accept.length === defaultAccept.length && accept.every((a) => defaultAccept.includes(a));
  const types = same ? "PDF, imagem, DOCX, TXT ou MD" : accept.map((a) => a.slice(1).toUpperCase()).join(", ");
  return `${types} · até ${formatBytes(maxSize)}`;
}

/**
 * Zona de soltar arquivos com a lista de envios logo abaixo. Funciona por arrastar, por clique e por teclado
 * (o campo de arquivo nativo continua focável). Tipo e tamanho são conferidos aqui; o envio fica com quem usa.
 */
export function FileDropzone({
  files = [],
  onAdd,
  onRemove,
  onRetry,
  accept = defaultAccept,
  maxSize = defaultMaxSize,
  multiple = true,
  disabled,
  hint,
  forceState,
}: FileDropzoneProps) {
  const inputId = useId();
  const hintId = useId();
  const input = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [rejections, setRejections] = useState<Rejection[]>([]);

  const receive = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    const taken = multiple ? incoming : incoming.slice(0, 1);
    const ok: File[] = [];
    const rejected: Rejection[] = [];
    for (const file of taken) {
      if (!accept.includes(extensionOf(file.name))) rejected.push({ name: file.name, reason: "tipo não aceito" });
      else if (file.size === 0) rejected.push({ name: file.name, reason: "arquivo vazio" });
      else if (file.size > maxSize) rejected.push({ name: file.name, reason: `maior que ${formatBytes(maxSize)}` });
      else ok.push(file);
    }
    if (!multiple && incoming.length > 1) {
      for (const file of incoming.slice(1)) rejected.push({ name: file.name, reason: "só um arquivo por vez" });
    }
    setRejections(rejected);
    if (ok.length) onAdd(ok);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    receive(e.target.files);
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
  };
  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    depth.current++;
    setDragging(true);
  };
  const onDragLeave = () => {
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragging(false);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    depth.current = 0;
    setDragging(false);
    if (!disabled) receive(e.dataTransfer.files);
  };

  const over = dragging || forceState === "dragover";
  const zoneClasses = [
    "dropzone",
    over && "dropzone--over",
    disabled && "dropzone--disabled",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="dropzone-group">
      <label
        className={zoneClasses}
        data-state={forceState}
        onDragEnter={onDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          ref={input}
          id={inputId}
          className="dropzone__input"
          type="file"
          accept={accept.join(",")}
          multiple={multiple}
          disabled={disabled}
          aria-describedby={hintId}
          onChange={onChange}
        />
        <span className="dropzone__icon" aria-hidden>
          <Upload size={28} />
        </span>
        <span className="dropzone__call">
          {over ? (
            "Solte para adicionar"
          ) : (
            <>
              Solte {multiple ? "os arquivos" : "o arquivo"} aqui ou <span className="dropzone__pick">escolha no computador</span>
            </>
          )}
        </span>
        <span id={hintId} className="dropzone__hint">
          {hint ?? defaultHint(accept, maxSize)}
        </span>
      </label>

      <AnimatePresence initial={false}>
        {rejections.length > 0 && (
          <motion.div
            key="rejections"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={transition.soft}
            style={{ overflow: "hidden" }}
          >
            <InlineAlert
              tone="danger"
              title={rejections.length === 1 ? "Um arquivo não foi adicionado" : `${rejections.length} arquivos não foram adicionados`}
              onDismiss={() => setRejections([])}
              dismissLabel="Fechar aviso de arquivos recusados"
            >
              <ul>
                {rejections.map((r, i) => (
                  <li key={`${r.name}-${i}`}>
                    <strong>{r.name}</strong>: {r.reason}
                  </li>
                ))}
              </ul>
            </InlineAlert>
          </motion.div>
        )}
      </AnimatePresence>

      {files.length > 0 && (
        <ul className="dropzone__list" aria-label="Arquivos">
          <AnimatePresence initial={false}>
            {files.map((file) => (
              <motion.li
                key={file.id}
                layout
                className={`file file--${file.status}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={transition.soft}
              >
                <span className="file__type">
                  <TypeIcon name={file.name} />
                </span>
                <div className="file__main">
                  <span className="file__name" title={file.name}>
                    {file.name}
                  </span>
                  {file.status === "error" ? (
                    <span className="file__error">
                      <CircleAlert size={16} strokeWidth={2.25} aria-hidden />
                      {file.error ?? "Falhou ao enviar"}
                    </span>
                  ) : (
                    <span className="file__meta">
                      {formatBytes(file.size)}
                      {file.status === "uploading" && file.progress !== undefined && ` · ${Math.round(file.progress)}%`}
                    </span>
                  )}
                  {file.status === "uploading" && (
                    <ProgressBar
                      compact
                      value={file.progress}
                      indeterminate={file.progress === undefined}
                      aria-label={`Enviando ${file.name}`}
                    />
                  )}
                </div>
                <div className="file__side">
                  {file.status === "done" && (
                    <Badge tone="success" icon={<Check size={14} strokeWidth={2.5} />}>
                      Enviado
                    </Badge>
                  )}
                  {file.status === "error" && onRetry && (
                    <Button variant="link" onClick={() => onRetry(file.id)}>
                      Tentar de novo
                    </Button>
                  )}
                  {onRemove && (
                    <CloseButton
                      label={file.status === "uploading" ? `Cancelar envio de ${file.name}` : `Remover ${file.name}`}
                      onClick={() => onRemove(file.id)}
                    />
                  )}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
