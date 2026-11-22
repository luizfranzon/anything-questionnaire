import type { ReactNode } from "react";
import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import { Loader2 } from "lucide-react";
import { tapScale, transition } from "../../motion";
import "./Button.css";

export type ButtonVariant = "primary" | "secondary" | "destructive" | "link";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  /** Só um `primary` por tela. */
  variant?: ButtonVariant;
  /** Use dentro de painéis escuros (ex.: o painel de correção). */
  onDark?: boolean;
  /** Troca o rótulo por um spinner mantendo o tamanho exato. */
  loading?: boolean;
  /** Ícone Lucide opcional antes do rótulo. */
  icon?: ReactNode;
  children?: ReactNode;
  /** Só para a matriz de estados do Storybook. */
  forceState?: "hover" | "pressed" | "focus";
}

export function Button({
  variant = "primary",
  onDark = false,
  loading = false,
  icon,
  forceState,
  className,
  children,
  disabled,
  onClick,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = ["btn", `btn--${variant}`, onDark && "btn--on-dark", className].filter(Boolean).join(" ");
  const inert = disabled || loading;
  return (
    <motion.button
      {...rest}
      type={type}
      className={classes}
      disabled={disabled}
      aria-busy={loading || undefined}
      data-state={forceState}
      onClick={loading ? undefined : onClick}
      // Link não encolhe: é texto, não um objeto que se aperta.
      whileTap={inert || variant === "link" ? undefined : { scale: tapScale }}
      transition={transition.snappy}
    >
      <motion.span
        className="btn__content"
        animate={{ opacity: loading ? 0 : 1 }}
        transition={transition.fade}
      >
        {icon}
        {children}
      </motion.span>
      <AnimatePresence>
        {loading && (
          <motion.span
            className="btn__spinner"
            role="status"
            aria-label="Carregando"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={transition.snappy}
          >
            <Loader2 size={20} aria-hidden />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
