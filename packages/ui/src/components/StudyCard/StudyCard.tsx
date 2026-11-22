import { motion } from "motion/react";
import { ClipboardCheck, Pencil, Play, Trash2 } from "lucide-react";
import { transition } from "../../motion";
import { Badge } from "../Badge/Badge";
import { IconButton } from "../IconButton/IconButton";
import { Skeleton, SkeletonGroup } from "../Skeleton/Skeleton";
import "./StudyCard.css";

export interface StudyCardProps {
  name: string;
  /** O Objetivo do Estudo, em até duas linhas. */
  goal: string;
  /** Tópicos aprovados. Com 0, o cartão avisa que falta aprovar. */
  topicCount: number;
  sourceCount: number;
  /** "22/11". Sem valor: "Sem atividade ainda". */
  lastActivity?: string;
  /** Rodada aberta, para retomar. */
  roundInProgress?: { done: number; total: number };
  /** Abre o Estudo como link. Sem `href`, use `onOpen`. */
  href?: string;
  onOpen?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  status?: "ready" | "loading";
  className?: string;
  /** Só para a matriz de estados do Storybook. */
  forceState?: "hover" | "focus";
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Resumo de um Estudo na lista de Estudos. O cartão todo abre o Estudo; editar e excluir ficam no canto. */
export function StudyCard({
  name,
  goal,
  topicCount,
  sourceCount,
  lastActivity,
  roundInProgress,
  href,
  onOpen,
  onEdit,
  onDelete,
  status = "ready",
  className,
  forceState,
}: StudyCardProps) {
  const classes = ["scard", className].filter(Boolean).join(" ");

  if (status === "loading") {
    return (
      <article className={classes} aria-busy="true">
        <SkeletonGroup label="Carregando o Estudo">
          <Skeleton width="45%" height={32} />
          <Skeleton lines={2} width="100%" />
          <Skeleton width={260} />
        </SkeletonGroup>
      </article>
    );
  }

  const link = href ? (
    <a className="scard__link" href={href}>
      {name}
    </a>
  ) : (
    <button type="button" className="scard__link" onClick={onOpen}>
      {name}
    </button>
  );

  return (
    <motion.article
      className={classes}
      data-state={forceState}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition.soft}
    >
      <div className="scard__top">
        <h3 className="scard__title">{link}</h3>
        {(onEdit || onDelete) && (
          <div className="scard__actions">
            {onEdit && <IconButton label={`Editar ${name}`} icon={<Pencil size={18} aria-hidden />} onClick={onEdit} />}
            {onDelete && <IconButton label={`Excluir ${name}`} tone="danger" icon={<Trash2 size={18} aria-hidden />} onClick={onDelete} />}
          </div>
        )}
      </div>

      <p className="scard__goal">{goal}</p>

      {(roundInProgress || topicCount === 0) && (
        <div className="scard__badges">
          {roundInProgress && (
            <Badge tone="info" icon={<Play size={14} strokeWidth={2.5} />}>
              Rodada em andamento: {roundInProgress.done}/{roundInProgress.total}
            </Badge>
          )}
          {topicCount === 0 && (
            <Badge tone="warn" icon={<ClipboardCheck size={14} strokeWidth={2.5} />}>
              Tópicos por aprovar
            </Badge>
          )}
        </div>
      )}

      <p className="scard__meta">
        {[
          topicCount > 0 ? plural(topicCount, "Tópico", "Tópicos") : null,
          plural(sourceCount, "Fonte", "Fontes"),
          lastActivity ? `Última atividade ${lastActivity}` : "Sem atividade ainda",
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </motion.article>
  );
}
