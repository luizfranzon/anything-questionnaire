import { StatusTag } from "../Badge/Badge";
import { ProgressBar } from "../ProgressBar/ProgressBar";
import { Skeleton } from "../Skeleton/Skeleton";
import { TrendIndicator, type Trend } from "../TrendIndicator/TrendIndicator";
import "./TopicRow.css";

export interface TopicRowProps {
  name: string;
  /** Desempenho de 0 a 100. `null` quando o Tópico nunca foi perguntado. */
  performance: number | null;
  trend: Trend;
  /** Variação em pontos percentuais, repassada ao `TrendIndicator`. */
  delta?: number;
  /** Número de Respostas. */
  answers: number;
  /** Tópico arquivado: fora do sorteio, mas ainda listado. */
  archived?: boolean;
  /** `loading` mantém o tamanho exato da linha. */
  status?: "ready" | "loading";
  className?: string;
}

/** Linha de Tópico na página do Estudo. Use dentro de um `ul`; a ordem (do mais fraco ao mais forte) é de quem lista. */
export function TopicRow({ name, performance, trend, delta, answers, archived, status = "ready", className }: TopicRowProps) {
  const classes = ["trow", archived && "trow--archived", className].filter(Boolean).join(" ");

  if (status === "loading") {
    return (
      <li className={classes} aria-hidden>
        <Skeleton width="60%" />
        <Skeleton shape="block" width="100%" height={6} />
        <Skeleton width={40} />
        <Skeleton width={96} />
        <Skeleton width={80} />
      </li>
    );
  }

  const asked = performance !== null;
  const pct = asked ? Math.round(performance) : 0;
  return (
    <li className={classes}>
      <span className="trow__name">
        {name}
        {archived && <StatusTag status="archived" />}
      </span>
      <ProgressBar compact value={pct} aria-label={asked ? `Desempenho de ${name}: ${pct}%` : `${name}: nunca perguntado`} />
      <span className="trow__percent">{asked ? `${pct}%` : "—"}</span>
      <TrendIndicator trend={trend} delta={delta} />
      <span className="trow__answers">{asked ? `${answers} ${answers === 1 ? "Resposta" : "Respostas"}` : "Nunca perguntado"}</span>
    </li>
  );
}
