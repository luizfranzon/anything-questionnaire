import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { transition } from "../../motion";
import "./Tabs.css";

export interface TabItem {
  id: string;
  label: string;
  /** Número ao lado do rótulo, ex.: quantidade de Fontes. */
  count?: number;
  disabled?: boolean;
  panel: ReactNode;
  /** Só para a matriz de estados do Storybook. */
  forceState?: "hover" | "pressed" | "focus";
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  "aria-label"?: string;
  className?: string;
}

export function Tabs({ items, value, defaultValue, onValueChange, className, "aria-label": ariaLabel }: TabsProps) {
  const uid = useId();
  const [inner, setInner] = useState(defaultValue ?? items.find((i) => !i.disabled)?.id);
  const current = value ?? inner;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const select = (id: string) => {
    if (value === undefined) setInner(id);
    onValueChange?.(id);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const enabled = items.filter((i) => !i.disabled);
    const at = enabled.findIndex((i) => i.id === current);
    let next: number | undefined;
    if (e.key === "ArrowRight") next = (at + 1) % enabled.length;
    else if (e.key === "ArrowLeft") next = (at - 1 + enabled.length) % enabled.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = enabled.length - 1;
    if (next === undefined) return;
    e.preventDefault();
    const target = enabled[next];
    select(target.id);
    refs.current[target.id]?.focus();
  };

  const active = items.find((i) => i.id === current);

  return (
    <div className={["tabs", className].filter(Boolean).join(" ")}>
      <div className="tabs__list" role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown}>
        {items.map((item) => {
          const selected = item.id === current;
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[item.id] = el;
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              data-state={item.forceState}
              className="tabs__tab"
              onClick={() => select(item.id)}
            >
              <span className="tabs__label">{item.label}</span>
              {item.count !== undefined && <span className="tabs__count">{item.count}</span>}
              {selected && <motion.span layoutId={`${uid}-indicator`} className="tabs__indicator" transition={transition.snappy} />}
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {active && (
          <motion.div
            key={active.id}
            role="tabpanel"
            id={`${uid}-panel-${active.id}`}
            aria-labelledby={`${uid}-tab-${active.id}`}
            tabIndex={0}
            className="tabs__panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition.fade}
          >
            {active.panel}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
