import { useState, type FormEvent } from "react";
import { Globe, Plus, Video } from "lucide-react";
import { Button } from "../Button/Button";
import { FileDropzone, type FileDropzoneProps } from "../FileDropzone/FileDropzone";
import { InlineAlert } from "../InlineAlert/InlineAlert";
import { Tabs } from "../Tabs/Tabs";
import { TextInput } from "../TextInput/TextInput";
import { Textarea } from "../Textarea/Textarea";
import "./SourceAddForm.css";

export type SourceAddKind = "text" | "file" | "site" | "youtube";

/** O que o formulário entrega. Arquivos não passam por aqui: o envio é feito pelo `FileDropzone`. */
export type SourceAddValue =
  | { kind: "text"; title?: string; text: string }
  | { kind: "site"; url: string }
  | { kind: "youtube"; url: string };

export interface SourceAddFormProps {
  onSubmit: (value: SourceAddValue) => void;
  /** Enviando o texto ou a URL. Trava os campos e mantém o tamanho do botão. */
  submitting?: boolean;
  /** Falha ao enviar. Os campos mantêm o que foi digitado. */
  submitError?: string;
  /** Props do `FileDropzone` (lista de envios, `onAdd`, `onRemove`, `onRetry`). */
  files: Pick<FileDropzoneProps, "files" | "onAdd" | "onRemove" | "onRetry">;
  /**
   * O Estudo já tem Fontes: o formulário começa recolhido atrás de "Adicionar Fonte".
   * Sem Fontes ele fica sempre aberto, e a lista vazia é o próprio formulário.
   */
  collapsible?: boolean;
  /** Começa aberto mesmo sendo `collapsible`. */
  defaultOpen?: boolean;
  /** Aba inicial. */
  defaultKind?: SourceAddKind;
  className?: string;
}

const TEXT_LIMIT = 200_000;

export function validateUrl(value: string): string | undefined {
  const url = value.trim();
  if (!url) return "Informe o endereço da página.";
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "Endereço inválido. Comece por http:// ou https://.";
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "Endereço inválido. Comece por http:// ou https://.";
  return undefined;
}

export function validateYoutube(value: string): string | undefined {
  const base = validateUrl(value);
  if (base) return base === "Informe o endereço da página." ? "Informe o link do vídeo." : base;
  const host = new URL(value.trim()).hostname.replace(/^www\./, "").replace(/^m\./, "");
  if (host !== "youtube.com" && host !== "youtu.be") return "Esse link não é de um vídeo do YouTube.";
  return undefined;
}

/** Cartão para adicionar uma Fonte: texto, arquivo, site ou YouTube (tickets 11 a 14). */
export function SourceAddForm({
  onSubmit,
  submitting,
  submitError,
  files,
  collapsible,
  defaultOpen,
  defaultKind = "text",
  className,
}: SourceAddFormProps) {
  const [open, setOpen] = useState(!collapsible || !!defaultOpen);
  const [kind, setKind] = useState<SourceAddKind>(defaultKind);
  // Cada aba guarda o seu rascunho: trocar de aba não apaga o que foi digitado.
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [site, setSite] = useState("");
  const [video, setVideo] = useState("");
  const [touched, setTouched] = useState<Partial<Record<SourceAddKind, boolean>>>({});
  const touch = (k: SourceAddKind) => setTouched((t) => ({ ...t, [k]: true }));

  const errors = {
    text: text.trim() ? (text.length > TEXT_LIMIT ? "O texto passa do limite de 200 mil caracteres." : undefined) : "Cole o texto da Fonte.",
    site: validateUrl(site),
    youtube: validateYoutube(video),
  };

  const submit = (k: "text" | "site" | "youtube") => (e: FormEvent) => {
    e.preventDefault();
    touch(k);
    if (errors[k] || submitting) return;
    if (k === "text") onSubmit({ kind: "text", title: title.trim() || undefined, text: text.trim() });
    else if (k === "site") onSubmit({ kind: "site", url: site.trim() });
    else onSubmit({ kind: "youtube", url: video.trim() });
  };

  const actions = () => (
    <div className="saf__actions">
      {collapsible && (
        <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
          Cancelar
        </Button>
      )}
      <Button type="submit" variant="primary" icon={<Plus size={18} />} loading={submitting}>
        Adicionar
      </Button>
    </div>
  );

  const alert = submitError ? (
    <InlineAlert tone="danger" title="Não foi possível adicionar a Fonte">
      {submitError}
    </InlineAlert>
  ) : null;

  if (!open) {
    return (
      <div className={["saf", "saf--closed", className].filter(Boolean).join(" ")}>
        <Button variant="secondary" icon={<Plus size={18} />} onClick={() => setOpen(true)}>
          Adicionar Fonte
        </Button>
      </div>
    );
  }

  return (
    <section className={["saf", className].filter(Boolean).join(" ")} aria-labelledby="saf-title">
      <h3 id="saf-title" className="saf__title">
        Adicionar Fonte
      </h3>
      <Tabs
        aria-label="Tipo de Fonte"
        value={kind}
        onValueChange={(id) => setKind(id as SourceAddKind)}
        items={[
          {
            id: "text",
            label: "Texto",
            panel: (
              <form className="saf__form" onSubmit={submit("text")} noValidate>
                <TextInput
                  label="Nome"
                  optional
                  placeholder="Anotações da aula 3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={submitting}
                  maxLength={120}
                />
                <Textarea
                  label="Texto"
                  help="Cole o conteúdo ou escreva. Para TXT e MD, use a aba Arquivo."
                  value={text}
                  minRows={6}
                  maxRows={14}
                  onChange={(e) => setText(e.target.value)}
                  onBlur={() => touch("text")}
                  error={touched.text ? errors.text : undefined}
                  disabled={submitting}
                />
                {kind === "text" && alert}
                {actions()}
              </form>
            ),
          },
          {
            id: "file",
            label: "Arquivo",
            panel: (
              <div className="saf__form">
                <FileDropzone multiple accept={[".pdf", ".png", ".jpg", ".jpeg", ".webp", ".docx", ".txt", ".md"]} {...files} />
                {collapsible && (
                  <div className="saf__actions">
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                      Fechar
                    </Button>
                  </div>
                )}
              </div>
            ),
          },
          {
            id: "site",
            label: "Site",
            panel: (
              <form className="saf__form" onSubmit={submit("site")} noValidate>
                <TextInput
                  label="Endereço da página"
                  type="url"
                  inputMode="url"
                  icon={<Globe size={18} />}
                  placeholder="https://exemplo.com.br/artigo"
                  help="A página é baixada uma vez. Mudanças depois não afetam o Estudo."
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  onBlur={() => {
                    setSite((v) => v.trim());
                    touch("site");
                  }}
                  error={touched.site ? errors.site : undefined}
                  disabled={submitting}
                />
                {kind === "site" && alert}
                {actions()}
              </form>
            ),
          },
          {
            id: "youtube",
            label: "YouTube",
            panel: (
              <form className="saf__form" onSubmit={submit("youtube")} noValidate>
                <TextInput
                  label="Link do vídeo"
                  type="url"
                  inputMode="url"
                  icon={<Video size={18} />}
                  placeholder="https://www.youtube.com/watch?v=..."
                  help="Usamos a legenda do vídeo: a manual, ou a automática se não houver."
                  value={video}
                  onChange={(e) => setVideo(e.target.value)}
                  onBlur={() => {
                    setVideo((v) => v.trim());
                    touch("youtube");
                  }}
                  error={touched.youtube ? errors.youtube : undefined}
                  disabled={submitting}
                />
                {kind === "youtube" && alert}
                {actions()}
              </form>
            ),
          },
        ]}
      />
    </section>
  );
}
