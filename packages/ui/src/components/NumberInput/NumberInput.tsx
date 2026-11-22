import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { tapScale, transition } from "../../motion";
import { Control, FieldShell, describedBy, type ControlForcedState } from "../Field/Field";
import "./NumberInput.css";

export interface NumberInputProps {
  label: string;
  /** `null` é campo vazio. */
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Texto fixo depois do número (ex.: "dias", "US$"). */
  unit?: string;
  optional?: boolean;
  help?: ReactNode;
  /** Erro vindo de fora (ex.: o servidor recusou). Tem prioridade sobre o erro de faixa. */
  error?: ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  loading?: boolean;
  id?: string;
  className?: string;
  onBlur?: () => void;
  /** Só para a matriz de estados do Storybook. */
  forceState?: ControlForcedState;
  /** Só para a matriz: mostra o erro de faixa sem precisar sair do campo. */
  forceTouched?: boolean;
}

const decimals = (n: number) => (String(n).split(".")[1] ?? "").length;
const format = (n: number) => String(n).replace(".", ",");

function rangeMessage(min?: number, max?: number) {
  if (min != null && max != null) return `Use um valor entre ${format(min)} e ${format(max)}.`;
  if (min != null) return `Use um valor de ${format(min)} ou mais.`;
  return `Use um valor de até ${format(max!)}.`;
}

export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  optional,
  help,
  error,
  disabled,
  readOnly,
  loading,
  id: idProp,
  className,
  onBlur,
  forceState,
  forceTouched,
}: NumberInputProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [text, setText] = useState(value == null ? "" : format(value));
  const [touched, setTouched] = useState(false);
  // Último valor que este componente emitiu: se `value` mudar por outro motivo, o texto acompanha.
  const emitted = useRef<number | null>(value);
  useEffect(() => {
    if (value !== emitted.current) {
      emitted.current = value;
      setText(value == null ? "" : format(value));
    }
  }, [value]);

  const emit = (next: number | null, nextText: string) => {
    emitted.current = next;
    setText(nextText);
    onChange(next);
  };

  const outOfRange = value != null && ((min != null && value < min) || (max != null && value > max));
  const rangeError = (touched || forceTouched) && outOfRange && (min != null || max != null) ? rangeMessage(min, max) : null;
  const shownError = error ?? rangeError;

  const stepBy = (dir: 1 | -1) => {
    setTouched(true);
    const base = value ?? (dir === 1 ? (min ?? 0) - step : (max ?? 0) + step);
    const places = Math.max(decimals(step), decimals(base));
    let next = Number((base + dir * step).toFixed(places));
    if (min != null) next = Math.max(min, next);
    if (max != null) next = Math.min(max, next);
    emit(next, format(next));
  };

  const inert = disabled || readOnly || loading;
  const atMin = value != null && min != null && value <= min;
  const atMax = value != null && max != null && value >= max;

  return (
    <FieldShell id={id} label={label} optional={optional} help={help} error={shownError} disabled={disabled}>
      <Control
        invalid={!!shownError}
        disabled={disabled}
        readOnly={readOnly}
        loading={loading}
        forceState={forceState}
        className={["number", className].filter(Boolean).join(" ")}
      >
        <Stepper label="Diminuir" disabled={inert || atMin} onStep={() => stepBy(-1)}>
          <Minus size={18} aria-hidden />
        </Stepper>
        <input
          id={id}
          className="control__input number__input"
          type="text"
          inputMode="decimal"
          role="spinbutton"
          autoComplete="off"
          value={text}
          disabled={disabled}
          readOnly={readOnly}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value ?? undefined}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={describedBy(id, { error: shownError, help })}
          aria-busy={loading || undefined}
          onChange={(e) => {
            const raw = e.target.value;
            if (!/^-?\d*[.,]?\d*$/.test(raw)) return;
            const parsed = raw.trim() === "" ? null : Number(raw.replace(",", "."));
            emit(parsed != null && Number.isNaN(parsed) ? null : parsed, raw);
          }}
          onKeyDown={(e) => {
            if (inert) return;
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              stepBy(e.key === "ArrowUp" ? 1 : -1);
            }
          }}
          onBlur={() => {
            setTouched(true);
            // Normaliza "3," e "-" para o que o número realmente é.
            setText(value == null ? "" : format(value));
            onBlur?.();
          }}
        />
        {unit && <span className="number__unit">{unit}</span>}
        <Stepper label="Aumentar" disabled={inert || atMax} onStep={() => stepBy(1)}>
          <Plus size={18} aria-hidden />
        </Stepper>
      </Control>
    </FieldShell>
  );
}

const HOLD_DELAY = 400;
const REPEAT_START = 110;
const REPEAT_MIN = 40;

/** Atalho para o mouse. Fora do Tab: o teclado usa as setas do campo. Segurar repete e acelera. */
function Stepper({
  label,
  disabled,
  onStep,
  children,
}: {
  label: string;
  disabled?: boolean;
  onStep: () => void;
  children: ReactNode;
}) {
  // O intervalo lê sempre a versão mais recente (o valor muda a cada passo).
  const latest = useRef(onStep);
  latest.current = onStep;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stop = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
  };
  const start = () => {
    stop();
    latest.current();
    let interval = REPEAT_START;
    const tick = () => {
      latest.current();
      interval = Math.max(REPEAT_MIN, interval * 0.92);
      timer.current = setTimeout(tick, interval);
    };
    timer.current = setTimeout(tick, HOLD_DELAY);
  };

  // Chegou no limite (botão desabilitou) ou saiu da tela: para de repetir.
  useEffect(() => {
    if (disabled) stop();
  }, [disabled]);
  useEffect(() => stop, []);

  return (
    <motion.button
      type="button"
      className="number__step"
      aria-label={label}
      tabIndex={-1}
      disabled={disabled}
      onPointerDown={(e) => {
        if (e.button === 0) start();
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      // Ativação sem ponteiro (leitor de tela): o clique chega com detail 0.
      onClick={(e) => {
        if (e.detail === 0) onStep();
      }}
      // Não deixa o clique tirar o foco do campo.
      onMouseDown={(e) => e.preventDefault()}
      whileTap={disabled ? undefined : { scale: tapScale }}
      transition={transition.snappy}
    >
      {children}
    </motion.button>
  );
}
