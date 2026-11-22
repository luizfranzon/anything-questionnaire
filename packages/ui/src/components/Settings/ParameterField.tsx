import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "../Button/Button";
import { NumberInput } from "../NumberInput/NumberInput";
import "./Settings.css";

export interface ParameterFieldProps {
  /** Nome do parâmetro, ex.: "Janela de Respostas recentes". */
  label: string;
  /** O que o parâmetro muda no motor, em uma frase. */
  description: ReactNode;
  value: number | null;
  onChange: (value: number | null) => void;
  /** Faixa válida. O erro aparece ao sair do campo e a faixa fica sempre à vista. */
  min: number;
  max: number;
  step?: number;
  /** Valor padrão do motor. Mostrado ao lado e usado por "Restaurar padrão". */
  defaultValue: number;
  /** Texto depois do número, ex.: "Respostas", "%". */
  unit?: string;
  /** Erro vindo de quem grava (ex.: "Não foi possível gravar"). */
  error?: ReactNode;
  saving?: boolean;
  disabled?: boolean;
  className?: string;
  /** Só para a matriz de estados do Storybook: mostra o erro de faixa sem sair do campo. */
  forceTouched?: boolean;
}

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

/** Parâmetro do motor com faixa e padrão (ticket 21). Monta sobre `NumberInput`. */
export function ParameterField({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step = 1,
  defaultValue,
  unit,
  error,
  saving,
  disabled,
  className,
  forceTouched,
}: ParameterFieldProps) {
  const changed = value !== defaultValue;
  return (
    <div className={["param", className].filter(Boolean).join(" ")}>
      <NumberInput
        label={label}
        help={
          <>
            {description} <span className="param__range">Entre {fmt(min)} e {fmt(max)}.</span>
          </>
        }
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        unit={unit}
        error={error}
        loading={saving}
        disabled={disabled}
        forceTouched={forceTouched}
      />
      <div className="param__foot">
        {changed ? (
          <Button
            variant="link"
            icon={<RotateCcw size={16} aria-hidden />}
            onClick={() => onChange(defaultValue)}
            disabled={disabled || saving}
          >
            {`Restaurar ${fmt(defaultValue)}`}
          </Button>
        ) : (
          <span className="param__default">Valor padrão</span>
        )}
      </div>
    </div>
  );
}
