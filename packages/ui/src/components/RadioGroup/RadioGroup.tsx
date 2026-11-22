import { useId, useState, type ReactNode } from "react";
import { ChoiceItem, ChoiceMessage, messageId, type ChoiceForcedState, type ChoiceVariant } from "../Choice/Choice";
import "./RadioGroup.css";

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** Pergunta ou título do grupo. Sempre visível. */
  legend: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: ChoiceVariant;
  /** `horizontal` só para opções curtas, na versão simples. */
  orientation?: "vertical" | "horizontal";
  /** Mostra "(opcional)" ao lado da legenda. Por padrão todo grupo é obrigatório. */
  optional?: boolean;
  help?: ReactNode;
  /** Mensagem de erro, sempre com ícone. Quem valida decide quando mostrar. */
  error?: ReactNode;
  disabled?: boolean;
  name?: string;
  className?: string;
  /** Só para a matriz de estados do Storybook: força o estado de uma opção pelo valor. */
  forceState?: { value: string; state: ChoiceForcedState };
}

export function RadioGroup({
  legend,
  options,
  value: valueProp,
  defaultValue,
  onValueChange,
  variant = "plain",
  orientation = "vertical",
  optional,
  help,
  error,
  disabled,
  name: nameProp,
  className,
  forceState,
}: RadioGroupProps) {
  const id = useId();
  const name = nameProp ?? id;
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const msg = messageId(id, { error, help });
  return (
    <fieldset
      className={["radio-group", disabled && "radio-group--disabled", className].filter(Boolean).join(" ")}
      disabled={disabled}
      aria-describedby={msg}
      aria-invalid={error ? true : undefined}
    >
      <legend className="radio-group__legend">
        {legend}
        {optional && <span className="radio-group__optional"> (opcional)</span>}
      </legend>
      <div
        className={[
          "radio-group__options",
          variant === "card" ? "radio-group__options--card" : orientation === "horizontal" && "radio-group__options--row",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {options.map((o) => (
          <ChoiceItem
            key={o.value}
            kind="radio"
            id={`${id}-${o.value}`}
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => {
              if (valueProp === undefined) setInner(o.value);
              onValueChange?.(o.value);
            }}
            label={o.label}
            description={o.description}
            variant={variant}
            disabled={disabled || o.disabled}
            invalid={!!error}
            forceState={forceState?.value === o.value ? forceState.state : undefined}
          />
        ))}
      </div>
      <ChoiceMessage id={`${id}-message`} help={help} error={error} />
    </fieldset>
  );
}
