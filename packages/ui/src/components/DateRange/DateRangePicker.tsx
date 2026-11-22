import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { transition } from "../../motion";
import { Control, FieldShell, describedBy } from "../Field/Field";
import { RangeCalendar } from "./RangeCalendar";
import { formatShort, parseISO, toISO, addDays, type ISODate } from "./dates";
import "../Select/Select.css";
import "./DateRange.css";

export interface DateRangePreset {
  id: string;
  label: string;
  /** Período do atalho a partir de hoje. */
  range: (today: ISODate) => { from: ISODate; to: ISODate };
}

export interface DateRangeValue {
  /** Id de um atalho, ou `"custom"` quando o usuário escolheu os dias no calendário. */
  preset: string;
  /** Em atalho, o período vem do atalho e estes dois são ignorados. `""` = sem período. */
  from: ISODate | "";
  to: ISODate | "";
}

export interface DateRangePickerProps {
  label: string;
  value: DateRangeValue;
  /** Já com o período completo: atalho ou dois cliques no calendário. */
  onChange: (value: { preset: string; from: ISODate; to: ISODate }) => void;
  presets: DateRangePreset[];
  /** Hoje. Padrão: o dia do sistema. Dias depois de `max` ficam desabilitados. */
  today?: ISODate;
  /** Primeiro dia permitido, opcional. */
  min?: ISODate;
  /** Último dia permitido. Padrão: hoje (consumo não existe no futuro). Use `null` para liberar o futuro. */
  max?: ISODate | null;
  placeholder?: string;
  help?: ReactNode;
  error?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  defaultOpen?: boolean;
  /** Só para a matriz de estados do Storybook. */
  forceState?: "hover" | "focus";
}

/** Atalhos usados nas Métricas. */
export const metricsPresets: DateRangePreset[] = [
  { id: "today", label: "Hoje", range: (t) => ({ from: t, to: t }) },
  { id: "7d", label: "Últimos 7 dias", range: (t) => ({ from: addDays(t, -6), to: t }) },
  { id: "30d", label: "Últimos 30 dias", range: (t) => ({ from: addDays(t, -29), to: t }) },
  { id: "90d", label: "Últimos 90 dias", range: (t) => ({ from: addDays(t, -89), to: t }) },
];

/** Campo de período com painel flutuante: atalhos à esquerda e calendário à direita (ticket 20). */
export function DateRangePicker({
  label,
  value,
  onChange,
  presets,
  today: todayProp,
  min,
  max,
  placeholder = "Escolha o período",
  help,
  error,
  loading,
  disabled,
  id: idProp,
  className,
  defaultOpen = false,
  forceState,
}: DateRangePickerProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const panelId = `${id}-panel`;
  const today = todayProp ?? toISO(new Date());
  const refYear = parseISO(today).getFullYear();
  const effectiveMax = max === null ? undefined : (max ?? today);

  const inert = disabled || loading;
  const [open, setOpen] = useState(defaultOpen && !inert);
  const trigger = useRef<HTMLButtonElement>(null);
  // O foco só vai para dentro do painel quando ele abriu pelo teclado ou pelo clique no campo
  const [focusInside, setFocusInside] = useState(false);

  const preset = presets.find((p) => p.id === value.preset);
  const shown = preset ? preset.range(today) : { from: value.from, to: value.to };
  const hasShown = !!shown.from && !!shown.to;
  const rangeText = hasShown
    ? shown.from === shown.to
      ? formatShort(shown.from, refYear)
      : `${formatShort(shown.from, refYear)} – ${formatShort(shown.to, refYear)}`
    : "";

  const openPanel = () => {
    if (inert) return;
    setFocusInside(true);
    setOpen(true);
  };
  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) trigger.current?.focus();
  };

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (inert) return;
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      openPanel();
    } else if (open && e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  };

  return (
    <FieldShell id={id} label={label} help={help} error={error} disabled={disabled}>
      <div
        className="drp"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
        }}
        onKeyDown={(e) => {
          if (open && e.key === "Escape" && e.target !== trigger.current) {
            e.stopPropagation();
            close();
          }
        }}
      >
        <Control
          invalid={!!error}
          disabled={disabled}
          loading={loading}
          forceState={forceState}
          className={["select__control", open && "select__control--open", className].filter(Boolean).join(" ")}
        >
          <span className="control__icon" aria-hidden>
            <CalendarDays size={20} />
          </span>
          <button
            id={id}
            ref={trigger}
            type="button"
            className="control__input select__trigger drp__trigger"
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id, { error, help })}
            aria-busy={loading || undefined}
            onClick={() => (open ? close(false) : openPanel())}
            onKeyDown={onTriggerKey}
          >
            {hasShown ? (
              <>
                <span className="select__value">{preset ? preset.label : rangeText}</span>
                {preset && <span className="drp__range">{rangeText}</span>}
              </>
            ) : (
              <span className="select__value select__value--placeholder">{placeholder}</span>
            )}
          </button>
          {!loading && (
            <motion.span
              className="control__icon select__chevron"
              aria-hidden
              animate={{ rotate: open ? 180 : 0 }}
              transition={transition.snappy}
            >
              <ChevronDown size={20} />
            </motion.span>
          )}
        </Control>

        <AnimatePresence>
          {open && (
            <motion.div
              id={panelId}
              role="dialog"
              aria-label={label}
              className="drp__panel"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: transition.soft }}
              exit={{ opacity: 0, y: -4, transition: transition.fade }}
            >
              <ul className="drp__presets" aria-label="Atalhos">
                {presets.map((p) => {
                  const current = p.id === value.preset;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        className={["drp__preset", current && "drp__preset--current"].filter(Boolean).join(" ")}
                        aria-pressed={current}
                        onClick={() => {
                          onChange({ preset: p.id, ...p.range(today) });
                          close();
                        }}
                      >
                        <span>{p.label}</span>
                        {current && <Check size={18} strokeWidth={2.5} aria-hidden />}
                      </button>
                    </li>
                  );
                })}
                {value.preset === "custom" && (
                  <li className="drp__custom" aria-hidden>
                    Período personalizado
                  </li>
                )}
              </ul>
              <RangeCalendar
                value={shown}
                min={min}
                max={effectiveMax}
                today={today}
                autoFocus={focusInside}
                onEscape={() => close()}
                onChange={(r) => {
                  onChange({ preset: "custom", ...r });
                  close();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FieldShell>
  );
}
