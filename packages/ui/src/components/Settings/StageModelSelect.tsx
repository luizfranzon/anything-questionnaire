import { RotateCcw } from "lucide-react";
import { Button } from "../Button/Button";
import { Select, type SelectOption } from "../Select/Select";
import "./Settings.css";

export interface StageModelSelectProps {
  /** Nome da Etapa, ex.: "Geração de Perguntas". Vira o rótulo do campo. */
  stage: string;
  /** O que a Etapa faz, em uma frase. */
  description: string;
  /** Modelos oferecidos. A descrição de cada um costuma trazer o preço. */
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** Modelo padrão da Etapa. Quando `value` for outro, aparece "Restaurar padrão". */
  defaultValue?: string;
  /** Gravando a escolha: o campo mantém o tamanho e não abre. */
  saving?: boolean;
  /** Não gravou. Quem usa mostra a frase e o que fazer. */
  error?: string;
  disabled?: boolean;
  className?: string;
}

/** Modelo do Claude de uma Etapa (ticket 19). Uma linha por Etapa, empilhadas pela tela de Configurações. */
export function StageModelSelect({
  stage,
  description,
  options,
  value,
  onValueChange,
  defaultValue,
  saving,
  error,
  disabled,
  className,
}: StageModelSelectProps) {
  const changed = defaultValue != null && value !== defaultValue;
  const defaultLabel = options.find((o) => o.value === defaultValue)?.label;

  return (
    <div className={["stagemodel", className].filter(Boolean).join(" ")}>
      <Select
        label={stage}
        help={description}
        options={options}
        value={value}
        onValueChange={onValueChange}
        loading={saving}
        disabled={disabled}
        error={error}
      />
      <div className="stagemodel__foot">
        {changed && defaultLabel ? (
          <Button
            variant="link"
            icon={<RotateCcw size={16} aria-hidden />}
            onClick={() => onValueChange(defaultValue)}
            disabled={disabled || saving}
          >
            {`Restaurar ${defaultLabel}`}
          </Button>
        ) : defaultValue != null ? (
          <span className="stagemodel__default">Modelo padrão</span>
        ) : null}
      </div>
    </div>
  );
}
