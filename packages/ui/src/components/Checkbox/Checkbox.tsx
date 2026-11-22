import { useId, useState, type ReactNode } from "react";
import { ChoiceItem, ChoiceMessage, messageId, type ChoiceForcedState, type ChoiceVariant } from "../Choice/Choice";

export interface CheckboxProps {
  label: ReactNode;
  /** Linha de apoio abaixo do rótulo. */
  description?: ReactNode;
  /** `plain` é o marcador ao lado do texto; `card` põe borda de 2px em volta (escolhas com descrição). */
  variant?: ChoiceVariant;
  /** Controlado. `"indeterminate"` para o "marcar tudo" de um grupo parcialmente marcado. */
  checked?: boolean | "indeterminate";
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  help?: ReactNode;
  /** Mensagem de erro, sempre com ícone. Quem valida decide quando mostrar. */
  error?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  value?: string;
  className?: string;
  /** Só para a matriz de estados do Storybook. */
  forceState?: ChoiceForcedState;
}

export function Checkbox({
  label,
  description,
  variant = "plain",
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  help,
  error,
  disabled,
  required,
  id: idProp,
  name,
  value,
  className,
  forceState,
}: CheckboxProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [inner, setInner] = useState(defaultChecked);
  const checked = checkedProp ?? inner;
  const msg = messageId(id, { error, help });
  return (
    <div className="choice-wrap">
      <ChoiceItem
        kind="checkbox"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => {
          if (checkedProp === undefined) setInner(e.target.checked);
          onCheckedChange?.(e.target.checked);
        }}
        label={label}
        description={description}
        variant={variant}
        disabled={disabled}
        invalid={!!error}
        required={required}
        describedBy={msg}
        forceState={forceState}
        className={className}
      />
      <ChoiceMessage id={`${id}-message`} help={help} error={error} />
    </div>
  );
}
