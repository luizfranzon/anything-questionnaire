import { motion } from "motion/react";
import { CircleAlert, Play } from "lucide-react";
import { transition } from "../../motion";
import { Button } from "../Button/Button";
import { ProgressBar } from "../ProgressBar/ProgressBar";
import "./RoundInProgressBanner.css";

export interface RoundInProgressBannerProps {
  /** Perguntas respondidas e total da Rodada. */
  done: number;
  total: number;
  mode: "study" | "mock";
  /** "22/11". */
  startedAt?: string;
  /** "Continuar": leva à próxima Pergunta não respondida. */
  onResume: () => void;
  /** Abrindo a Rodada: o botão mostra o spinner. */
  resuming?: boolean;
  /** Falha ao abrir. Aparece no banner e o botão vira "Tentar de novo". */
  error?: string;
  className?: string;
}

const MODE_LABEL = { study: "Modo estudo", mock: "Simulado" } as const;

/** Faixa da página do Estudo para retomar a Rodada aberta. "Nova Rodada" segue sendo a única ação primária. */
export function RoundInProgressBanner({ done, total, mode, startedAt, onResume, resuming, error, className }: RoundInProgressBannerProps) {
  return (
    <motion.section
      className={["rbanner", className].filter(Boolean).join(" ")}
      aria-label="Rodada em andamento"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition.soft}
    >
      <div className="rbanner__body">
        <p className="rbanner__title">
          Rodada em andamento: {done}/{total}
        </p>
        <p className="rbanner__meta">
          {[MODE_LABEL[mode], startedAt ? `começou em ${startedAt}` : null].filter(Boolean).join(" · ")}. Criar uma Rodada nova encerra esta.
        </p>
        <ProgressBar compact value={done} max={total} aria-label={`${done} de ${total} Perguntas respondidas`} />
        {error && (
          <p className="rbanner__error" role="alert">
            <CircleAlert size={16} aria-hidden />
            <span>{error}</span>
          </p>
        )}
      </div>
      <Button variant="secondary" icon={<Play size={18} aria-hidden />} loading={resuming} onClick={onResume}>
        {error ? "Tentar de novo" : "Continuar"}
      </Button>
    </motion.section>
  );
}
