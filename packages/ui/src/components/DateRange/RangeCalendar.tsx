import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { transition } from "../../motion";
import { IconButton } from "../IconButton/IconButton";
import {
  MONTHS,
  WEEKDAYS,
  addDays,
  addMonths,
  clamp,
  daysBetween,
  formatLong,
  formatShort,
  monthGrid,
  parseISO,
  sameMonth,
  startOfMonth,
  weekday,
  type ISODate,
} from "./dates";
import "./DateRange.css";

export interface DateRange {
  /** `""` quando ainda não há período. */
  from: ISODate | "";
  to: ISODate | "";
}

export interface RangeCalendarProps {
  value: DateRange;
  /** Só é chamado com o período completo (primeiro e último dia). */
  onChange: (range: { from: ISODate; to: ISODate }) => void;
  /** Dias fora de `min` e `max` ficam desabilitados. */
  min?: ISODate;
  max?: ISODate;
  /** Dia de hoje (marcado na grade). Padrão: o dia do sistema. */
  today?: ISODate;
  /** Leva o foco ao dia ao montar (usado pelo painel do `DateRangePicker`). */
  autoFocus?: boolean;
  /** Chamado com Esc quando não há dia inicial pendente. */
  onEscape?: () => void;
  className?: string;
  /** Só para a matriz de estados do Storybook: simula o primeiro clique e o mouse sobre outro dia. */
  forceAnchor?: ISODate;
  forceHover?: ISODate;
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/**
 * Calendário de um mês com seleção de período em dois cliques (ticket 20).
 * O primeiro clique marca o início, o mouse (ou o foco) mostra a prévia, o segundo fecha o período;
 * se o segundo dia vier antes do primeiro, os dois se invertem. Teclado: setas, Home/End, PageUp/PageDown.
 */
export function RangeCalendar({
  value,
  onChange,
  min,
  max,
  today: todayProp,
  autoFocus,
  onEscape,
  className,
  forceAnchor,
  forceHover,
}: RangeCalendarProps) {
  const uid = useId();
  const today = todayProp ?? localToday();
  const refYear = parseISO(today).getFullYear();

  const initialFocus = clamp(value.from || today, min, max);
  const [view, setView] = useState(startOfMonth(value.to || value.from || initialFocus));
  const [focusDay, setFocusDay] = useState<ISODate>(initialFocus);
  const [anchor, setAnchor] = useState<ISODate | null>(null);
  const [hover, setHover] = useState<ISODate | null>(null);
  const [hasFocus, setHasFocus] = useState(false);
  const moveFocus = useRef(!!autoFocus);

  const dayId = (iso: ISODate) => `${uid}-d-${iso}`;
  const disabledDay = (iso: ISODate) => (!!min && iso < min) || (!!max && iso > max);

  useEffect(() => {
    if (moveFocus.current) {
      moveFocus.current = false;
      document.getElementById(dayId(focusDay))?.focus();
    }
  });

  const pendingFrom = forceAnchor ?? anchor;
  const pending = pendingFrom != null;
  const previewEnd = forceHover ?? hover ?? (hasFocus ? focusDay : pendingFrom);

  let lo: ISODate | "" = value.from;
  let hi: ISODate | "" = value.to;
  if (pendingFrom && previewEnd) {
    lo = pendingFrom <= previewEnd ? pendingFrom : previewEnd;
    hi = pendingFrom <= previewEnd ? previewEnd : pendingFrom;
  }
  const hasRange = !!lo && !!hi;

  const pick = (iso: ISODate) => {
    if (disabledDay(iso)) return;
    setFocusDay(iso);
    if (!anchor) {
      setAnchor(iso);
      return;
    }
    const from = anchor <= iso ? anchor : iso;
    const to = anchor <= iso ? iso : anchor;
    setAnchor(null);
    setHover(null);
    onChange({ from, to });
  };

  const goMonth = (dir: 1 | -1) => {
    const next = clamp(addMonths(focusDay, dir), min, max);
    setFocusDay(next);
    setView(startOfMonth(next));
  };
  const canPrev = !min || startOfMonth(view) > startOfMonth(min);
  const canNext = !max || startOfMonth(view) < startOfMonth(max);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, iso: ISODate) => {
    let target: ISODate | undefined;
    switch (e.key) {
      case "ArrowLeft":
        target = addDays(iso, -1);
        break;
      case "ArrowRight":
        target = addDays(iso, 1);
        break;
      case "ArrowUp":
        target = addDays(iso, -7);
        break;
      case "ArrowDown":
        target = addDays(iso, 7);
        break;
      case "Home":
        target = addDays(iso, -weekday(iso));
        break;
      case "End":
        target = addDays(iso, 6 - weekday(iso));
        break;
      case "PageUp":
        target = addMonths(iso, e.shiftKey ? -12 : -1);
        break;
      case "PageDown":
        target = addMonths(iso, e.shiftKey ? 12 : 1);
        break;
      case "Escape":
        if (anchor) {
          e.preventDefault();
          e.stopPropagation();
          setAnchor(null);
          setHover(null);
        } else onEscape?.();
        return;
      default:
        return;
    }
    e.preventDefault();
    target = clamp(target, min, max);
    setFocusDay(target);
    if (!sameMonth(target, view)) setView(startOfMonth(target));
    moveFocus.current = true;
  };

  const [vy, vm] = view.split("-").map(Number);
  const monthName = MONTHS[vm - 1][0].toUpperCase() + MONTHS[vm - 1].slice(1);
  const weeks = monthGrid(view);

  let status: string;
  if (pending) status = "Escolha o último dia.";
  else if (hasRange) {
    const n = daysBetween(value.from, value.to);
    const text = value.from === value.to ? formatShort(value.from, refYear) : `${formatShort(value.from, refYear)} – ${formatShort(value.to, refYear)}`;
    status = `${text} · ${n} ${n === 1 ? "dia" : "dias"}`;
  } else status = "Escolha o primeiro dia.";

  return (
    <div className={["rc", className].filter(Boolean).join(" ")}>
      <div className="rc__head">
        <IconButton label="Mês anterior" icon={<ChevronLeft size={18} aria-hidden />} onClick={() => goMonth(-1)} disabled={!canPrev} />
        <h4 id={`${uid}-h`} className="rc__title" aria-live="polite">
          {monthName} {vy}
        </h4>
        <IconButton label="Próximo mês" icon={<ChevronRight size={18} aria-hidden />} onClick={() => goMonth(1)} disabled={!canNext} />
      </div>

      <div
        role="grid"
        aria-labelledby={`${uid}-h`}
        className="rc__grid"
        onFocus={() => setHasFocus(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHasFocus(false);
        }}
        onPointerLeave={() => setHover(null)}
      >
        <div role="row" className="rc__row rc__row--head">
          {WEEKDAYS.map((w, i) => (
            <span key={i} role="columnheader" aria-label={w.long} className="rc__weekday">
              {w.short}
            </span>
          ))}
        </div>
        <motion.div
          key={view}
          role="rowgroup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition.fade}
        >
          {weeks.map((week, w) => (
            <div key={w} role="row" className="rc__row">
              {week.map((iso, c) => {
                if (!iso) return <span key={c} role="gridcell" className="rc__cell rc__cell--empty" />;
                const isLo = iso === lo;
                const isHi = iso === hi;
                const inBand = hasRange && lo !== hi && iso >= lo && iso <= hi;
                // Fechado: os dois extremos cheios. Pendente: só o dia inicial cheio, o da prévia só com contorno.
                const filled = pending ? iso === pendingFrom : hasRange && (isLo || isHi);
                const ghost = pending && !filled && (isLo || isHi);
                const off = disabledDay(iso);
                const isToday = iso === today;
                const label = [
                  formatLong(iso),
                  isToday && "hoje",
                  filled && (pending ? "primeiro dia" : isLo && isHi ? "único dia" : isLo ? "primeiro dia" : "último dia"),
                ]
                  .filter(Boolean)
                  .join(", ");
                const tabbable = iso === focusDay;
                return (
                  <span
                    key={c}
                    role="gridcell"
                    aria-selected={hasRange && iso >= lo && iso <= hi ? true : undefined}
                    className={[
                      "rc__cell",
                      inBand && "rc__cell--band",
                      inBand && isLo && "rc__cell--from",
                      inBand && isHi && "rc__cell--to",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <button
                      id={dayId(iso)}
                      type="button"
                      className={["rc__day", filled && "rc__day--filled", ghost && "rc__day--ghost", isToday && "rc__day--today"]
                        .filter(Boolean)
                        .join(" ")}
                      aria-label={label}
                      aria-current={isToday ? "date" : undefined}
                      disabled={off}
                      tabIndex={tabbable ? 0 : -1}
                      onClick={() => pick(iso)}
                      onPointerEnter={() => !off && setHover(iso)}
                      onKeyDown={(e) => onKeyDown(e, iso)}
                    >
                      {Number(iso.slice(8))}
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </motion.div>
      </div>

      <p className="rc__status" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
