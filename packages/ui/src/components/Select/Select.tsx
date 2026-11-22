import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { transition } from "../../motion";
import { Control, FieldShell, describedBy } from "../Field/Field";
import "./Select.css";

export interface SelectOption {
  value: string;
  label: string;
  /** Linha de apoio abaixo do rótulo (ex.: preço do modelo). */
  description?: string;
  disabled?: boolean;
}

export interface SelectProps {
  label: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
  help?: ReactNode;
  /** Mensagem de erro. Quem valida decide quando mostrar. */
  error?: ReactNode;
  /** Ícone Lucide opcional à esquerda. */
  icon?: ReactNode;
  /** Carregando as opções. Mantém o tamanho do campo e não abre. */
  loading?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Mensagem quando `options` está vazio. */
  emptyText?: string;
  id?: string;
  /** Nome para envio em formulário. */
  name?: string;
  className?: string;
  /** Abre já na primeira renderização (matriz de estados do Storybook). */
  defaultOpen?: boolean;
  /** Só para a matriz de estados do Storybook. */
  forceState?: "hover" | "focus";
}

export function Select({
  label,
  options,
  value: valueProp,
  defaultValue,
  onValueChange,
  placeholder = "Selecione",
  optional,
  help,
  error,
  icon,
  loading,
  disabled,
  readOnly,
  emptyText = "Nenhuma opção disponível.",
  id: idProp,
  name,
  className,
  defaultOpen = false,
  forceState,
}: SelectProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const listId = `${id}-list`;
  const optId = (i: number) => `${id}-opt-${i}`;

  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const inert = disabled || readOnly || loading;
  const [open, setOpen] = useState(defaultOpen && !inert);
  const [active, setActive] = useState(() => (selectedIndex >= 0 ? selectedIndex : options.findIndex((o) => !o.disabled)));
  const buffer = useRef({ text: "", timer: 0 });

  const firstEnabled = () => options.findIndex((o) => !o.disabled);
  const lastEnabled = () => options.map((o) => !o.disabled).lastIndexOf(true);

  useEffect(() => {
    if (open && active >= 0) document.getElementById(optId(active))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  const openList = () => {
    if (inert) return;
    setActive(selectedIndex >= 0 ? selectedIndex : firstEnabled());
    setOpen(true);
  };
  const close = () => setOpen(false);
  const choose = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    if (valueProp === undefined) setInner(o.value);
    onValueChange?.(o.value);
    close();
  };
  const move = (dir: 1 | -1) => {
    for (let i = active + dir; i >= 0 && i < options.length; i += dir) {
      if (!options[i].disabled) return setActive(i);
    }
  };
  const typeahead = (char: string) => {
    window.clearTimeout(buffer.current.timer);
    buffer.current.text += char.toLowerCase();
    buffer.current.timer = window.setTimeout(() => (buffer.current.text = ""), 600);
    const text = buffer.current.text;
    const from = text.length === 1 ? active + 1 : Math.max(active, 0);
    for (let n = 0; n < options.length; n++) {
      const i = (from + n) % options.length;
      if (!options[i].disabled && options[i].label.toLowerCase().startsWith(text)) {
        if (!open) setOpen(true);
        return setActive(i);
      }
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (inert) return;
    const k = e.key;
    if (!open) {
      if (k === "ArrowDown" || k === "ArrowUp" || k === "Enter" || k === " ") {
        e.preventDefault();
        openList();
      } else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeahead(k);
      return;
    }
    switch (k) {
      case "ArrowDown":
        e.preventDefault();
        return move(1);
      case "ArrowUp":
        e.preventDefault();
        return move(-1);
      case "Home":
        e.preventDefault();
        return setActive(firstEnabled());
      case "End":
        e.preventDefault();
        return setActive(lastEnabled());
      case "Enter":
      case " ":
        e.preventDefault();
        return active >= 0 ? choose(active) : close();
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        return close();
      case "Tab":
        return close();
      default:
        if (k.length === 1 && k !== " " && !e.ctrlKey && !e.metaKey && !e.altKey) typeahead(k);
    }
  };

  return (
    <FieldShell id={id} label={label} optional={optional} help={help} error={error} disabled={disabled}>
      <div
        className="select"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close();
        }}
      >
        <Control
          invalid={!!error}
          disabled={disabled}
          readOnly={readOnly}
          loading={loading}
          forceState={forceState}
          className={["select__control", open && "select__control--open", className].filter(Boolean).join(" ")}
        >
          {icon && (
            <span className="control__icon" aria-hidden>
              {icon}
            </span>
          )}
          <button
            id={id}
            type="button"
            role="combobox"
            className="control__input select__trigger"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            aria-activedescendant={open && active >= 0 ? optId(active) : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id, { error, help })}
            aria-readonly={readOnly || undefined}
            aria-busy={loading || undefined}
            onClick={() => (open ? close() : openList())}
            onKeyDown={onKeyDown}
          >
            <span className={selected ? "select__value" : "select__value select__value--placeholder"}>
              {selected ? selected.label : placeholder}
            </span>
          </button>
          {!loading && !readOnly && (
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
            <motion.ul
              id={listId}
              role="listbox"
              aria-label={label}
              className="select__list"
              onMouseDown={(e) => e.preventDefault()}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: transition.soft }}
              exit={{ opacity: 0, y: -4, transition: transition.fade }}
            >
              {options.length === 0 && <li className="select__empty">{emptyText}</li>}
              {options.map((o, i) => (
                <li
                  key={o.value}
                  id={optId(i)}
                  role="option"
                  aria-selected={i === selectedIndex}
                  aria-disabled={o.disabled || undefined}
                  className={[
                    "select__option",
                    i === active && "select__option--active",
                    i === selectedIndex && "select__option--selected",
                    o.disabled && "select__option--disabled",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onMouseMove={() => !o.disabled && i !== active && setActive(i)}
                  onClick={() => choose(i)}
                >
                  <span className="select__option-body">
                    <span className="select__option-label">{o.label}</span>
                    {o.description && <span className="select__option-description">{o.description}</span>}
                  </span>
                  <span className="select__check" aria-hidden>
                    {i === selectedIndex && <Check size={18} strokeWidth={2.5} />}
                  </span>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
        {name && <input type="hidden" name={name} value={value ?? ""} disabled={disabled} />}
      </div>
    </FieldShell>
  );
}
