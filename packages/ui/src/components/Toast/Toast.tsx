import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { transition } from "../../motion";
import { Button } from "../Button/Button";
import { CloseButton } from "../CloseButton/CloseButton";
import { alertIcons, type AlertTone } from "../InlineAlert/InlineAlert";
import "./Toast.css";

export interface ToastProps {
  tone?: AlertTone;
  title: string;
  description?: ReactNode;
  action?: { label: string; onClick: () => void };
  onDismiss?: () => void;
  className?: string;
}

/** O cartão do aviso, sem a lógica de fila. Existe para a matriz do Storybook; no app use `useToast`. */
export function Toast({ tone = "info", title, description, action, onDismiss, className }: ToastProps) {
  const Icon = alertIcons[tone];
  return (
    <div className={["toast", `toast--${tone}`, className].filter(Boolean).join(" ")}>
      <Icon className="toast__icon" size={20} strokeWidth={2.25} aria-hidden />
      <div className="toast__body">
        <p className="toast__title">{title}</p>
        {description && <div className="toast__description">{description}</div>}
        {action && (
          <div className="toast__action">
            <Button variant="link" onClick={action.onClick}>
              {action.label}
            </Button>
          </div>
        )}
      </div>
      {onDismiss && <CloseButton label="Fechar aviso" onClick={onDismiss} className="toast__close" />}
    </div>
  );
}

export interface ToastOptions {
  tone?: AlertTone;
  title: string;
  description?: ReactNode;
  action?: { label: string; onClick: () => void };
  /** Tempo na tela em ms. `null` fica até fechar. Padrão: 6000, e erro nunca some sozinho. */
  duration?: number | null;
}

interface ToastEntry extends ToastOptions {
  id: string;
}

interface ToastApi {
  /** Mostra um aviso e devolve o id, para `dismiss`. */
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  return api;
}

const DEFAULT_DURATION = 6000;

function ToastItem({ entry, onDismiss }: { entry: ToastEntry; onDismiss: (id: string) => void }) {
  const { id, tone = "info", duration } = entry;
  const total = duration === undefined ? (tone === "danger" ? null : DEFAULT_DURATION) : duration;
  const [paused, setPaused] = useState(false);
  const remaining = useRef(total);
  const startedAt = useRef(0);

  // O relógio para com o mouse ou o foco em cima e retoma de onde parou.
  useEffect(() => {
    if (remaining.current === null || paused) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => onDismiss(id), remaining.current);
    return () => {
      clearTimeout(timer);
      if (remaining.current !== null) remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, id, onDismiss]);

  return (
    <motion.li
      layout
      className="toast-item"
      role={tone === "danger" ? "alert" : "status"}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={transition.soft}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Toast
        tone={tone}
        title={entry.title}
        description={entry.description}
        action={
          entry.action && {
            label: entry.action.label,
            onClick: () => {
              entry.action?.onClick();
              onDismiss(id);
            },
          }
        }
        onDismiss={() => onDismiss(id)}
      />
    </motion.li>
  );
}

export interface ToastProviderProps {
  children: ReactNode;
  /** Quantos aparecem ao mesmo tempo. Ao passar disso, o mais antigo sai. */
  max?: number;
}

/** Coloque uma vez na raiz. Os avisos aparecem no canto inferior direito. */
export function ToastProvider({ children, max = 3 }: ToastProviderProps) {
  const [entries, setEntries] = useState<ToastEntry[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => setEntries((list) => list.filter((e) => e.id !== id)), []);
  const toast = useCallback(
    (options: ToastOptions) => {
      const id = `toast-${++counter.current}`;
      setEntries((list) => [...list, { ...options, id }].slice(-max));
      return id;
    },
    [max],
  );
  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <section className="toast-viewport" aria-label="Avisos">
        <ol className="toast-list">
          <AnimatePresence initial={false}>
            {entries.map((entry) => (
              <ToastItem key={entry.id} entry={entry} onDismiss={dismiss} />
            ))}
          </AnimatePresence>
        </ol>
      </section>
    </ToastContext.Provider>
  );
}
