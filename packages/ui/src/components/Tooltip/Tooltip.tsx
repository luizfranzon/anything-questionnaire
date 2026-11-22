import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { transition } from "../../motion";
import "./Tooltip.css";

export type TooltipSide = "top" | "bottom" | "left" | "right";

const opposite: Record<TooltipSide, TooltipSide> = { top: "bottom", bottom: "top", left: "right", right: "left" };
const offset: Record<TooltipSide, { x?: number; y?: number }> = {
  top: { y: 4 },
  bottom: { y: -4 },
  left: { x: 4 },
  right: { x: -4 },
};

export interface TooltipProps {
  /** Texto curto. Sem interação dentro e nada essencial: quem usa só mouse ou só teclado precisa ler também. */
  content: string;
  side?: TooltipSide;
  /** Atraso antes de aparecer no hover, em ms. No foco do teclado aparece na hora. */
  delay?: number;
  /** Um único elemento que recebe foco (botão, link, campo). */
  children: ReactElement<{ "aria-describedby"?: string }>;
  /** Só para a matriz de estados do Storybook. */
  forceOpen?: boolean;
}

/** Dica flutuante. Fica dentro do fluxo (sem portal) e inverte o lado quando não cabe na janela. */
export function Tooltip({ content, side = "top", delay = 400, children, forceOpen }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const bubble = useRef<HTMLSpanElement>(null);

  const show = useCallback(
    (wait: number) => {
      clearTimeout(timer.current);
      if (wait <= 0) setOpen(true);
      else timer.current = setTimeout(() => setOpen(true), wait);
    },
    [],
  );
  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(false);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const visible = forceOpen || open;

  // Mede ao abrir: se a dica sair da janela no lado pedido, usa o oposto.
  useLayoutEffect(() => {
    if (!visible) return setFlipped(false);
    const el = bubble.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const out =
      side === "top" ? r.top < 0 : side === "bottom" ? r.bottom > innerHeight : side === "left" ? r.left < 0 : r.right > innerWidth;
    setFlipped(out);
  }, [visible, side]);

  const actual = flipped ? opposite[side] : side;
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      hide();
    }
  };

  return (
    <span
      className="tooltip"
      onMouseEnter={() => show(delay)}
      onMouseLeave={hide}
      onFocus={() => show(0)}
      onBlur={hide}
      onKeyDown={onKeyDown}
    >
      {cloneElement(children, { "aria-describedby": visible ? id : undefined })}
      <AnimatePresence>
        {visible && (
          <motion.span
            ref={bubble}
            id={id}
            role="tooltip"
            className={`tooltip__bubble tooltip__bubble--${actual}`}
            initial={{ opacity: 0, ...offset[actual] }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0 }}
            transition={transition.fade}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
