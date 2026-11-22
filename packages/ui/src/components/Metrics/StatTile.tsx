import { CircleAlert } from "lucide-react";
import { Skeleton } from "../Skeleton/Skeleton";
import "./Metrics.css";

export interface StatTileProps {
  /** O que o número mede, sem dois-pontos: "Tokens de entrada". */
  label: string;
  /** Já formatado: "1,2 mi", "US$ 4,20". */
  value: string;
  /** Linha de apoio, ex.: "1.240.000 tokens". Leitores de tela leem o valor completo aqui. */
  detail?: string;
  /** Carregando: reserva a altura do número e do rótulo. */
  loading?: boolean;
  /** Não carregou: o número vira "—" com o aviso, e o tamanho não muda. */
  error?: boolean;
  /** Destaca o total que a tela quer em primeiro lugar (o custo). Só um por conjunto. */
  emphasis?: boolean;
  className?: string;
}

/** Total do período (ticket 20). Fica num conjunto de cinco, em `ul` ou grade. */
export function StatTile({ label, value, detail, loading, error, emphasis, className }: StatTileProps) {
  const cls = ["stat", emphasis && "stat--emphasis", error && "stat--error", className].filter(Boolean).join(" ");
  return (
    <div className={cls} role="group" aria-label={label} aria-busy={loading || undefined}>
      <span className="stat__label">{label}</span>
      {loading ? (
        <Skeleton shape="block" width="60%" height={44} />
      ) : (
        <span className="stat__value">{error ? "—" : value}</span>
      )}
      <span className="stat__detail">
        {loading ? (
          <Skeleton width="40%" />
        ) : error ? (
          <>
            <CircleAlert size={14} aria-hidden /> Não carregou
          </>
        ) : (
          detail
        )}
      </span>
    </div>
  );
}
