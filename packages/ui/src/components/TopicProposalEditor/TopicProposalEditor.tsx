import { useId, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Archive, ArchiveRestore, Check, CircleAlert, Combine, ListPlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { transition } from "../../motion";
import { StatusTag } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { Checkbox } from "../Checkbox/Checkbox";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
import { EmptyState } from "../EmptyState/EmptyState";
import { Control } from "../Field/Field";
import { IconButton } from "../IconButton/IconButton";
import { InlineAlert } from "../InlineAlert/InlineAlert";
import { Select } from "../Select/Select";
import { Skeleton, SkeletonGroup } from "../Skeleton/Skeleton";
import "./TopicProposalEditor.css";

export interface EditableTopic {
  id: string;
  name: string;
  /** Só no modo `managed`: Tópico arquivado, fora do sorteio e das Revisões. */
  archived?: boolean;
  /** Mostrado como apoio ("12 Perguntas"). */
  questionCount?: number;
}

export interface TopicProposalEditorProps {
  /**
   * - `proposal`: proposta do Claude, antes de aprovar (ticket 02). Apaga de verdade e termina em "Aprovar Tópicos".
   * - `managed`: Tópicos já aprovados na página do Estudo (ticket 16). Arquiva e reativa, nunca apaga; juntar pede confirmação.
   */
  mode: "proposal" | "managed";
  topics: EditableTopic[];
  /** `loading`: lista ainda não chegou. `saving`: gravando uma alteração; trava os controles. */
  status?: "ready" | "loading" | "saving";
  /** Falha ao gravar. Aparece no topo (ou no diálogo de juntar) e a lista continua como estava. */
  error?: string;
  onRename: (id: string, name: string) => void;
  /** `ids` são os Tópicos de origem; `targetId` é o que fica, com o nome dele. */
  onMerge: (ids: string[], targetId: string) => void;
  onAdd: (name: string) => void;
  /** Só `proposal`. */
  onRemove?: (id: string) => void;
  /** Só `managed`. */
  onArchive?: (id: string) => void;
  onReactivate?: (id: string) => void;
  /** Só `proposal`: "Aprovar Tópicos", a única ação primária. */
  onApprove?: () => void;
  className?: string;
}

const MAX_NAME = 80;

function validateName(raw: string, topics: EditableTopic[], exceptId?: string): string | null {
  const name = raw.trim();
  if (!name) return "Dê um nome ao Tópico.";
  if (name.length > MAX_NAME) return `Use até ${MAX_NAME} caracteres.`;
  const clash = topics.some((t) => t.id !== exceptId && t.name.trim().toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"));
  return clash ? "Já existe um Tópico com esse nome." : null;
}

/** Revisa os Tópicos: renomear, juntar, apagar ou arquivar, e adicionar. Controlado: cada ação chama um callback. */
export function TopicProposalEditor({
  mode,
  topics,
  status = "ready",
  error,
  onRename,
  onMerge,
  onAdd,
  onRemove,
  onArchive,
  onReactivate,
  onApprove,
  className,
}: TopicProposalEditorProps) {
  const addId = useId();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [confirmMerge, setConfirmMerge] = useState(false);
  const [addDraft, setAddDraft] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const saving = status === "saving";
  const proposal = mode === "proposal";
  const classes = ["tpe", className].filter(Boolean).join(" ");

  if (status === "loading") {
    return (
      <section className={classes} aria-label="Tópicos" aria-busy="true">
        <SkeletonGroup label="Carregando os Tópicos">
          {[70, 52, 64, 46].map((w) => (
            <div key={w} className="tpe__skel-row">
              <Skeleton shape="block" width={24} height={24} />
              <Skeleton width={`${w}%`} />
            </div>
          ))}
        </SkeletonGroup>
      </section>
    );
  }

  const live = selected.filter((id) => topics.some((t) => t.id === id));
  const target = live.includes(targetId ?? "") ? (targetId as string) : live[0];
  const targetName = topics.find((t) => t.id === target)?.name ?? "";

  function startEdit(t: EditableTopic) {
    setEditingId(t.id);
    setDraft(t.name);
    setDraftError(null);
  }
  function cancelEdit() {
    setEditingId(null);
    setDraftError(null);
  }
  function saveEdit() {
    if (!editingId) return;
    const problem = validateName(draft, topics, editingId);
    if (problem) return setDraftError(problem);
    const current = topics.find((t) => t.id === editingId);
    if (current && current.name !== draft.trim()) onRename(editingId, draft.trim());
    cancelEdit();
  }
  function editKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      cancelEdit();
    }
  }
  function submitAdd() {
    const problem = validateName(addDraft, topics);
    if (problem) return setAddError(problem);
    onAdd(addDraft.trim());
    setAddDraft("");
    setAddError(null);
  }
  function toggle(id: string, on: boolean) {
    setSelected((cur) => (on ? [...cur.filter((x) => x !== id), id] : cur.filter((x) => x !== id)));
  }
  function doMerge() {
    if (!target) return;
    onMerge(
      live.filter((id) => id !== target),
      target,
    );
    setSelected([]);
    setConfirmMerge(false);
  }

  return (
    <section className={classes} aria-label="Tópicos">
      {error && !confirmMerge && (
        <InlineAlert tone="danger" title="Não foi possível gravar">
          {error}
        </InlineAlert>
      )}

      {topics.length === 0 ? (
        <EmptyState size="compact" outlined icon={<ListPlus size={28} aria-hidden />} title={proposal ? "Nenhum Tópico na proposta" : "Nenhum Tópico no Estudo"}>
          Adicione o primeiro Tópico abaixo.
        </EmptyState>
      ) : (
        <ul className="tpe__list">
          <AnimatePresence initial={false}>
            {topics.map((t) => {
              const editing = editingId === t.id;
              return (
                <motion.li
                  key={t.id}
                  layout="position"
                  className={["tpe__row", t.archived && "tpe__row--archived"].filter(Boolean).join(" ")}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: transition.fade }}
                  transition={transition.soft}
                >
                  {editing ? (
                    <div className="tpe__edit">
                      <Control invalid={!!draftError}>
                        <input
                          className="control__input"
                          value={draft}
                          autoFocus
                          aria-label={`Novo nome de ${t.name}`}
                          aria-invalid={draftError ? true : undefined}
                          aria-describedby={draftError ? `${t.id}-error` : undefined}
                          onChange={(e) => {
                            setDraft(e.target.value);
                            setDraftError(null);
                          }}
                          onKeyDown={editKey}
                        />
                      </Control>
                      <IconButton label="Salvar nome" icon={<Check size={18} aria-hidden />} onClick={saveEdit} />
                      <IconButton label="Cancelar" icon={<X size={18} aria-hidden />} onClick={cancelEdit} />
                      {draftError && (
                        <p id={`${t.id}-error`} className="tpe__error" role="alert">
                          <CircleAlert size={16} aria-hidden />
                          <span>{draftError}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <Checkbox
                        label={t.name}
                        checked={live.includes(t.id)}
                        onCheckedChange={(on) => toggle(t.id, on)}
                        disabled={saving || t.archived}
                        className="tpe__check"
                      />
                      <span className="tpe__meta">
                        {t.archived && <StatusTag status="archived" />}
                        {t.questionCount != null && (
                          <span>
                            {t.questionCount} {t.questionCount === 1 ? "Pergunta" : "Perguntas"}
                          </span>
                        )}
                      </span>
                      <span className="tpe__actions">
                        <IconButton label={`Renomear ${t.name}`} icon={<Pencil size={18} aria-hidden />} onClick={() => startEdit(t)} disabled={saving} />
                        {proposal && onRemove && (
                          <IconButton label={`Apagar ${t.name}`} tone="danger" icon={<Trash2 size={18} aria-hidden />} onClick={() => onRemove(t.id)} disabled={saving} />
                        )}
                        {!proposal && !t.archived && onArchive && (
                          <IconButton label={`Arquivar ${t.name}`} icon={<Archive size={18} aria-hidden />} onClick={() => onArchive(t.id)} disabled={saving} />
                        )}
                        {!proposal && t.archived && onReactivate && (
                          <IconButton label={`Reativar ${t.name}`} icon={<ArchiveRestore size={18} aria-hidden />} onClick={() => onReactivate(t.id)} disabled={saving} />
                        )}
                      </span>
                    </>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <AnimatePresence initial={false}>
        {live.length >= 2 && (
          <motion.div
            key="merge"
            className="tpe__merge"
            role="group"
            aria-label="Juntar Tópicos"
            // Só opacidade e deslocamento: animar a altura exigiria `overflow: hidden`, que corta a lista do Select.
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={transition.soft}
          >
            <div className="tpe__merge-inner">
              <p className="tpe__merge-text">{live.length} Tópicos selecionados</p>
              <Select
                label="Manter o nome de"
                value={target}
                onValueChange={setTargetId}
                options={live.map((id) => ({ value: id, label: topics.find((t) => t.id === id)?.name ?? id }))}
                disabled={saving}
              />
              <div className="tpe__merge-actions">
                <Button variant="link" onClick={() => setSelected([])} disabled={saving}>
                  Limpar seleção
                </Button>
                <Button
                  variant="secondary"
                  icon={<Combine size={18} aria-hidden />}
                  loading={saving && !confirmMerge}
                  onClick={proposal ? doMerge : () => setConfirmMerge(true)}
                >
                  Juntar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        className="tpe__add"
        onSubmit={(e) => {
          e.preventDefault();
          submitAdd();
        }}
      >
        <div className="tpe__add-field">
          <Control invalid={!!addError} disabled={saving}>
            <input
              id={addId}
              className="control__input"
              value={addDraft}
              placeholder="Novo Tópico"
              aria-label="Nome do novo Tópico"
              aria-invalid={addError ? true : undefined}
              aria-describedby={addError ? `${addId}-error` : undefined}
              disabled={saving}
              onChange={(e) => {
                setAddDraft(e.target.value);
                setAddError(null);
              }}
            />
          </Control>
          {addError && (
            <p id={`${addId}-error`} className="tpe__error" role="alert">
              <CircleAlert size={16} aria-hidden />
              <span>{addError}</span>
            </p>
          )}
        </div>
        <Button type="submit" variant="secondary" icon={<Plus size={18} aria-hidden />} disabled={saving}>
          Adicionar
        </Button>
      </form>

      {proposal && onApprove && (
        <footer className="tpe__footer">
          <Button loading={saving} disabled={topics.length === 0} onClick={onApprove}>
            Aprovar Tópicos
          </Button>
        </footer>
      )}

      <ConfirmDialog
        open={confirmMerge}
        onClose={() => setConfirmMerge(false)}
        onConfirm={doMerge}
        title={`Juntar ${live.length} Tópicos em ${targetName}?`}
        confirmLabel="Juntar Tópicos"
        confirmIcon={<Combine size={18} aria-hidden />}
        loading={saving}
        error={error}
      >
        As Perguntas, os vínculos de Trechos e as Respostas passam para {targetName}, e o Desempenho passa a somar o histórico. Os outros Tópicos deixam de existir. Não dá para desfazer.
      </ConfirmDialog>
    </section>
  );
}
