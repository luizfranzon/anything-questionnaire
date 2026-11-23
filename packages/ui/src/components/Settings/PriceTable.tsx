import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, Coins } from "lucide-react";
import { EmptyState } from "../EmptyState/EmptyState";
import { Skeleton, SkeletonGroup } from "../Skeleton/Skeleton";
import "./Settings.css";

export type PriceField = "input" | "output" | "cacheRead" | "cacheWrite";

export interface PriceRow {
  id: string;
  /** Nome do modelo, ex.: "Opus 5.5". */
  model: string;
  /** US$ por 1 milhão de tokens. `null` = campo vazio. */
  input: number | null;
  output: number | null;
  cacheRead: number | null;
  cacheWrite: number | null;
}

export interface PriceTableProps {
  rows: PriceRow[];
  onChange: (id: string, field: PriceField, value: number | null) => void;
  /** O usuário saiu de um campo da linha: bom momento para gravar. */
  onCommit?: (id: string) => void;
  /** Carregando a tabela: mantém linhas e colunas no lugar. */
  loading?: boolean;
  /** Linha sendo gravada: os campos dela não aceitam edição. */
  savingId?: string;
  /** Erro de gravação por linha, com o que fazer. */
  errors?: Record<string, string>;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
}

const COLUMNS: { field: PriceField; label: string }[] = [
  { field: "input", label: "Entrada" },
  { field: "output", label: "Saída" },
  { field: "cacheRead", label: "Leitura de cache" },
  { field: "cacheWrite", label: "Gravação de cache" },
];

const format = (n: number | null) => (n == null ? "" : String(n).replace(".", ","));

interface CellProps {
  value: number | null;
  label: string;
  inert: boolean;
  invalid: boolean;
  describedBy?: string;
  onCommit: (value: number | null) => void;
  onBlur: () => void;
}

function PriceCell({ value, label, inert, invalid, describedBy, onCommit, onBlur }: CellProps) {
  const [text, setText] = useState(format(value));
  const emitted = useRef(value);
  useEffect(() => {
    if (value !== emitted.current) {
      emitted.current = value;
      setText(format(value));
    }
  }, [value]);

  return (
    <label className={["pricecell", invalid && "pricecell--invalid", inert && "pricecell--inert"].filter(Boolean).join(" ")}>
      <span className="pricecell__prefix" aria-hidden>
        US$
      </span>
      <input
        className="pricecell__input"
        size={1}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? describedBy : undefined}
        value={text}
        readOnly={inert}
        onChange={(e) => {
          const raw = e.target.value;
          if (!/^\d*[.,]?\d*$/.test(raw)) return;
          const parsed = raw.trim() === "" ? null : Number(raw.replace(",", "."));
          const next = parsed != null && Number.isNaN(parsed) ? null : parsed;
          emitted.current = next;
          setText(raw);
          onCommit(next);
        }}
        onBlur={() => {
          setText(format(value));
          onBlur();
        }}
      />
    </label>
  );
}

/** Tabela de preços por modelo, editável (ticket 19). Valores em US$ por 1 milhão de tokens. */
export function PriceTable({ rows, onChange, onCommit, loading, savingId, errors, readOnly, disabled, className }: PriceTableProps) {
  const uid = useId();
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  if (loading) {
    return (
      <SkeletonGroup label="Carregando preços">
        <div className={["prices", className].filter(Boolean).join(" ")}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} shape="block" height={56} />
          ))}
        </div>
      </SkeletonGroup>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState size="compact" outlined icon={<Coins size={28} aria-hidden />} title="Nenhum modelo na tabela">
        Os preços aparecem aqui quando houver modelos para escolher nas Etapas.
      </EmptyState>
    );
  }

  const messages: { key: string; id: string; text: string }[] = [];
  for (const row of rows) {
    for (const col of COLUMNS) {
      const key = `${row.id}:${col.field}`;
      if (touched[key] && row[col.field] == null) {
        messages.push({ key, id: `${uid}-${key}`, text: `${row.model}, ${col.label.toLowerCase()}: informe um preço, 0 ou mais.` });
      }
    }
    if (errors?.[row.id]) messages.push({ key: `${row.id}:save`, id: `${uid}-${row.id}-save`, text: `${row.model}: ${errors[row.id]}` });
  }

  const inertAll = readOnly || disabled;

  return (
    <div className={["prices", className].filter(Boolean).join(" ")}>
      <table className="prices__table">
        <caption className="prices__caption">US$ por 1 milhão de tokens</caption>
        <thead>
          <tr>
            <th scope="col" className="prices__model-head">
              Modelo
            </th>
            {COLUMNS.map((c) => (
              <th key={c.field} scope="col" className="prices__num-head">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={errors?.[row.id] ? "prices__row prices__row--error" : "prices__row"}>
              <th scope="row" className="prices__model">
                {row.model}
              </th>
              {COLUMNS.map((c) => {
                const key = `${row.id}:${c.field}`;
                const invalid = !!touched[key] && row[c.field] == null;
                return (
                  <td key={c.field} className="prices__cell">
                    <PriceCell
                      value={row[c.field]}
                      label={`${c.label}, ${row.model}`}
                      inert={!!inertAll || savingId === row.id}
                      invalid={invalid}
                      describedBy={`${uid}-${key}`}
                      onCommit={(v) => onChange(row.id, c.field, v)}
                      onBlur={() => {
                        setTouched((t) => ({ ...t, [key]: true }));
                        onCommit?.(row.id);
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {messages.length > 0 && (
        <ul className="prices__errors" role="alert">
          {messages.map((m) => (
            <li key={m.key} id={m.id} className="prices__error">
              <AlertCircle size={16} aria-hidden />
              <span>{m.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
