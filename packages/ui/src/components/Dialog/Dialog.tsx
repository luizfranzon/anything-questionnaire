import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { transition } from "../../motion";
import { CloseButton } from "../CloseButton/CloseButton";
import "./Dialog.css";

export type DialogSize = "sm" | "md";

interface PanelContent {
  title: ReactNode;
  /** Uma ou duas frases sob o título. Vira a descrição lida pelo leitor de tela. */
  description?: ReactNode;
  children?: ReactNode;
  /** Botões, alinhados à direita. A ação principal por último. */
  footer?: ReactNode;
  /** `sm` (460px) para confirmações; `md` (640px) para formulários. */
  size?: DialogSize;
  closeLabel?: string;
}

export interface DialogPanelProps extends PanelContent {
  onClose?: () => void;
  /** Desabilita o X enquanto algo grava. */
  busy?: boolean;
  titleId?: string;
  descriptionId?: string;
  className?: string;
}

/** O cartão do diálogo, sem a janela modal. Existe para a matriz do Storybook; no app use `Dialog`. */
export function DialogPanel({
  title,
  description,
  children,
  footer,
  size = "sm",
  closeLabel = "Fechar",
  onClose,
  busy,
  titleId,
  descriptionId,
  className,
}: DialogPanelProps) {
  return (
    <div className={["dialog__panel", `dialog__panel--${size}`, className].filter(Boolean).join(" ")}>
      <header className="dialog__header">
        <h2 id={titleId} className="dialog__title">
          {title}
        </h2>
        {onClose && <CloseButton label={closeLabel} onClick={onClose} disabled={busy} />}
      </header>
      <div className="dialog__body">
        {description && (
          <div id={descriptionId} className="dialog__description">
            {description}
          </div>
        )}
        {children}
      </div>
      {footer && <footer className="dialog__footer">{footer}</footer>}
    </div>
  );
}

export interface DialogProps extends PanelContent {
  open: boolean;
  onClose: () => void;
  /** Enquanto grava: Esc, clique fora e o X não fecham. */
  busy?: boolean;
}

/**
 * Janela modal sobre o `<dialog>` nativo: fica na camada do topo (não corta dentro de `overflow: hidden`),
 * prende o foco, deixa o resto da página inerte e fecha com Esc. Controlada por `open`.
 * O foco inicial vai ao primeiro controle; marque `autoFocus` no botão que deve recebê-lo.
 */
export function Dialog({ open, onClose, busy, ...content }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(open);
  const titleId = useId();
  const descriptionId = useId();

  if (open && !mounted) setMounted(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (open && el && !el.open) el.showModal();
  }, [open, mounted]);

  // Sem rolagem da página por trás
  useEffect(() => {
    if (!mounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted]);

  if (!mounted) return null;

  const finishClose = () => {
    if (open) return;
    ref.current?.close();
    setMounted(false);
  };

  return (
    <dialog
      ref={ref}
      className="dialog"
      data-closing={!open || undefined}
      aria-labelledby={titleId}
      aria-describedby={content.description ? descriptionId : undefined}
      onCancel={(e) => {
        // Esc: quem usa decide (controlada), e a animação de saída roda antes de fechar de fato.
        e.preventDefault();
        if (!busy) onClose();
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <motion.div
        className="dialog__motion"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={open ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 8, scale: 0.98 }}
        transition={transition.soft}
        onAnimationComplete={finishClose}
      >
        <DialogPanel {...content} onClose={onClose} busy={busy} titleId={titleId} descriptionId={descriptionId} />
      </motion.div>
    </dialog>
  );
}
