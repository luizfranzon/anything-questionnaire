import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { Control, FieldShell, describedBy, type ControlForcedState } from "../Field/Field";

export interface TextInputProps extends Omit<ComponentPropsWithRef<"input">, "size"> {
  label: string;
  optional?: boolean;
  help?: ReactNode;
  /** Mensagem de erro. Quem valida decide quando mostrar (ao sair do campo ou ao enviar). */
  error?: ReactNode;
  /** Ícone Lucide opcional à esquerda (ex.: link, vídeo). */
  icon?: ReactNode;
  /** Valida em segundo plano (ex.: checando a URL). Mantém o tamanho do campo. */
  loading?: boolean;
  /** Só para a matriz de estados do Storybook. */
  forceState?: ControlForcedState;
}

export function TextInput({
  label,
  optional,
  help,
  error,
  icon,
  loading,
  forceState,
  id: idProp,
  className,
  disabled,
  readOnly,
  type = "text",
  ...rest
}: TextInputProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell id={id} label={label} optional={optional} help={help} error={error} disabled={disabled}>
      <Control
        invalid={!!error}
        disabled={disabled}
        readOnly={readOnly}
        loading={loading}
        forceState={forceState}
        className={className}
      >
        {icon && (
          <span className="control__icon" aria-hidden>
            {icon}
          </span>
        )}
        <input
          {...rest}
          id={id}
          type={type}
          className="control__input"
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, { error, help })}
          aria-busy={loading || undefined}
        />
      </Control>
    </FieldShell>
  );
}
