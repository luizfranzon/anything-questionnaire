import type { MouseEvent, ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Skeleton, SkeletonGroup } from "../Skeleton/Skeleton";
import "./PageHeader.css";

export interface PageHeaderProps {
  /** Um nível acima, como link para voltar ("Estudos"). */
  back?: { label: string; href?: string; onClick?: () => void };
  title: string;
  /** `page`: título da página principal. `section`: páginas internas, menor. */
  level?: "page" | "section";
  /** Texto muted abaixo do título, ex.: o Objetivo do Estudo. */
  description?: string;
  /** Selos ou avisos curtos abaixo do título, ex.: "Rodada em andamento". */
  meta?: ReactNode;
  /** À direita do título. No máximo uma ação primária por tela. */
  actions?: ReactNode;
  /** Mantém a altura do conteúdo com Skeleton no lugar do título e da descrição. */
  loading?: boolean;
  className?: string;
  /** Só para a matriz de estados do Storybook. */
  forceBackState?: "hover" | "pressed" | "focus";
}

/** Título, voltar e ações no topo de cada página. */
export function PageHeader({
  back,
  title,
  level = "page",
  description,
  meta,
  actions,
  loading = false,
  className,
  forceBackState,
}: PageHeaderProps) {
  const onBack = (e: MouseEvent) => {
    if (!back?.onClick) return;
    e.preventDefault();
    back.onClick();
  };
  const Heading = level === "page" ? "h1" : "h2";

  return (
    <header className={["page-header", `page-header--${level}`, className].filter(Boolean).join(" ")}>
      {back && (
        <a className="page-header__back" href={back.href ?? "#"} data-state={forceBackState} onClick={onBack}>
          <ArrowLeft size={18} aria-hidden />
          {back.label}
        </a>
      )}
      <div className="page-header__row">
        <div className="page-header__text">
          {loading ? (
            <SkeletonGroup label="Carregando título">
              <Skeleton shape="block" width="55%" height={level === "page" ? 48 : 32} />
              {description !== undefined && <Skeleton lines={2} width="85%" />}
            </SkeletonGroup>
          ) : (
            <>
              <Heading className="page-header__title" title={title}>
                {title}
              </Heading>
              {description && <p className="page-header__description">{description}</p>}
              {meta && <div className="page-header__meta">{meta}</div>}
            </>
          )}
        </div>
        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
    </header>
  );
}
