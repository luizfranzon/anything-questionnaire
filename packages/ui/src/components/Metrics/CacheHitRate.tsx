import { useId } from "react";
import { Database, RotateCw } from "lucide-react";
import { Button } from "../Button/Button";
import { EmptyState } from "../EmptyState/EmptyState";
import { ProgressBar } from "../ProgressBar/ProgressBar";
import { Skeleton, SkeletonGroup } from "../Skeleton/Skeleton";
import { formatPercent } from "./format";
import "./Metrics.css";

export interface CacheHitRow {
  id: string;
  /** Nome da Etapa. */
  label: string;
  /** 0 a 1. `null` quando a Etapa não leu nem gravou cache no período. */
  rate: number | null;
  /** Apoio curto, ex.: "1,1 mi de 1,5 mi lidos do cache". */
  detail?: string;
}

export interface CacheHitRateProps {
  rows: CacheHitRow[];
  loading?: boolean;
  /** Não carregou. `onRetry` mostra "Tentar de novo". */
  error?: boolean;
  onRetry?: () => void;
  /** Recarregando depois de um filtro: mantém o desenho, mais claro. */
  refetching?: boolean;
  className?: string;
}

/** Taxa de acerto do cache por Etapa (ticket 20): uma barra por linha, sem cor de alerta (taxa baixa não é erro). */
export function CacheHitRate({ rows, loading, error, onRetry, refetching, className }: CacheHitRateProps) {
  const headId = useId();
  const cls = ["cache", className].filter(Boolean).join(" ");

  let body;
  if (error) {
    body = (
      <EmptyState
        size="compact"
        tone="danger"
        icon={<Database size={28} aria-hidden />}
        title="Não carregou a taxa de cache"
        action={
          onRetry && (
            <Button variant="secondary" icon={<RotateCw size={16} aria-hidden />} onClick={onRetry}>
              Tentar de novo
            </Button>
          )
        }
      />
    );
  } else if (loading) {
    body = (
      <SkeletonGroup label="Carregando taxa de cache">
        <div className="cache__list">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="cache__row">
              <Skeleton width="70%" />
              <Skeleton shape="block" height={8} />
              <Skeleton width={36} />
            </div>
          ))}
        </div>
      </SkeletonGroup>
    );
  } else if (rows.length === 0) {
    body = (
      <EmptyState size="compact" icon={<Database size={28} aria-hidden />} title="Sem chamadas no período">
        Mude o período ou os filtros para ver a taxa de cache.
      </EmptyState>
    );
  } else {
    body = (
      <ul className="cache__list" aria-labelledby={headId} style={{ opacity: refetching ? 0.5 : undefined }} aria-busy={refetching || undefined}>
        {rows.map((r) => (
          <li key={r.id} className="cache__row">
            <span className="cache__name">{r.label}</span>
            {r.rate == null ? (
              <>
                <span className="cache__track" aria-hidden />
                <span className="cache__figure cache__figure--none">Sem cache</span>
              </>
            ) : (
              <>
                <ProgressBar compact value={Math.round(r.rate * 100)} aria-label={`${r.label}: ${formatPercent(r.rate)}${r.detail ? `, ${r.detail}` : ""}`} />
                <span className="cache__figure">{formatPercent(r.rate)}</span>
              </>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className={cls}>
      <h3 id={headId} className="metric-card__title">
        Taxa de acerto do cache
      </h3>
      <p className="metric-card__sub">Parte da entrada que veio do cache, por Etapa.</p>
      {body}
    </section>
  );
}
