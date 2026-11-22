import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Pagination.css";

export interface PaginationProps {
  /** Página atual, a partir de 1. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Com `total` e `pageSize`, mostra "21–40 de 312". */
  total?: number;
  pageSize?: number;
  "aria-label"?: string;
  className?: string;
  /** Só para a matriz de estados do Storybook. */
  forceState?: { target: number | "prev" | "next"; state: "hover" | "pressed" | "focus" };
}

type Slot = number | "gap-start" | "gap-end";

/** 1 … 4 5 6 … 20: primeira, última, a atual e uma vizinha de cada lado. */
export function pageSlots(page: number, count: number): Slot[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const set = new Set([1, count, page - 1, page, page + 1]);
  // Perto das pontas, mostra mais páginas para o número de botões não pular.
  if (page <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (page >= count - 2) [count - 1, count - 2, count - 3].forEach((n) => set.add(n));
  const pages = [...set].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  const out: Slot[] = [];
  pages.forEach((n, i) => {
    const prev = pages[i - 1];
    if (prev !== undefined && n - prev === 2) out.push(prev + 1);
    else if (prev !== undefined && n - prev > 2) out.push(i < pages.length / 2 ? "gap-start" : "gap-end");
    out.push(n);
  });
  return out;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  total,
  pageSize,
  className,
  forceState,
  "aria-label": ariaLabel = "Paginação",
}: PaginationProps) {
  const go = (n: number) => onPageChange(Math.min(pageCount, Math.max(1, n)));
  const fs = (target: number | "prev" | "next") => (forceState?.target === target ? forceState.state : undefined);
  const range =
    total !== undefined && pageSize !== undefined
      ? `${total === 0 ? 0 : (page - 1) * pageSize + 1}–${Math.min(total, page * pageSize)} de ${total}`
      : undefined;

  return (
    <nav className={["pagination", className].filter(Boolean).join(" ")} aria-label={ariaLabel}>
      {range && <span className="pagination__range">{range}</span>}
      <ul className="pagination__list">
        <li>
          <button
            type="button"
            className="pagination__item pagination__item--nav"
            disabled={page <= 1}
            data-state={fs("prev")}
            onClick={() => go(page - 1)}
          >
            <ChevronLeft size={18} strokeWidth={2.25} aria-hidden />
            Anterior
          </button>
        </li>
        {pageSlots(page, pageCount).map((slot) =>
          typeof slot === "string" ? (
            <li key={slot} className="pagination__gap" aria-hidden>
              …
            </li>
          ) : (
            <li key={slot}>
              <button
                type="button"
                className="pagination__item"
                aria-label={`Página ${slot}`}
                aria-current={slot === page ? "page" : undefined}
                data-state={fs(slot)}
                onClick={() => go(slot)}
              >
                {slot}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            className="pagination__item pagination__item--nav"
            disabled={page >= pageCount}
            data-state={fs("next")}
            onClick={() => go(page + 1)}
          >
            Próxima
            <ChevronRight size={18} strokeWidth={2.25} aria-hidden />
          </button>
        </li>
      </ul>
    </nav>
  );
}
