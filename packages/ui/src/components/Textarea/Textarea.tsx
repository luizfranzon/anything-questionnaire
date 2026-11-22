import { useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type CSSProperties, type ReactNode } from "react";
import { Control, FieldShell, describedBy, type ControlForcedState } from "../Field/Field";
import "./Textarea.css";

export interface TextareaProps extends Omit<ComponentPropsWithRef<"textarea">, "rows"> {
  label: string;
  optional?: boolean;
  help?: ReactNode;
  error?: ReactNode;
  /** Altura mínima, em linhas. */
  minRows?: number;
  /** Depois disso o campo rola em vez de crescer. */
  maxRows?: number;
  loading?: boolean;
  /** Só para a matriz de estados do Storybook. */
  forceState?: ControlForcedState;
}

export function Textarea({
  label,
  optional,
  help,
  error,
  minRows = 3,
  maxRows = 12,
  loading,
  forceState,
  id: idProp,
  className,
  disabled,
  readOnly,
  maxLength,
  value,
  defaultValue,
  onChange,
  ...rest
}: TextareaProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const ref = useRef<HTMLTextAreaElement>(null);
  const [typed, setTyped] = useState(String(defaultValue ?? "").length);
  const count = value !== undefined ? String(value).length : typed;

  // Cresce com o conteúdo até maxRows.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Com field-sizing o navegador já cuida disso.
    if (typeof CSS !== "undefined" && CSS.supports("field-sizing", "content")) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, count, minRows, maxRows]);

  return (
    <FieldShell
      id={id}
      label={label}
      optional={optional}
      help={help}
      error={error}
      disabled={disabled}
      counter={maxLength ? `${count}/${maxLength}` : undefined}
    >
      <Control
        align="start"
        invalid={!!error}
        disabled={disabled}
        readOnly={readOnly}
        loading={loading}
        forceState={forceState}
        className={className}
      >
        <textarea
          {...rest}
          ref={ref}
          id={id}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={readOnly}
          className="control__input textarea__input"
          style={{ "--min-rows": minRows, "--max-rows": maxRows } as CSSProperties}
          onChange={(e) => {
            setTyped(e.target.value.length);
            onChange?.(e);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, { error, help })}
          aria-busy={loading || undefined}
        />
      </Control>
    </FieldShell>
  );
}
