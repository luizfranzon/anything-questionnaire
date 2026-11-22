import type { ReactNode } from "react";
import { motion } from "motion/react";
import { transition } from "../../motion";
import { StatusTag } from "../Badge/Badge";
import "./Contestation.css";

export type ContestationOutcome = "reviewing" | "kept" | "corrected" | "voided";

const COPY: Record<ContestationOutcome, { title: string; text: string }> = {
  reviewing: {
    title: "Reavaliando o Gabarito",
    text: "Esta Pergunta fica fora das Revisões até a análise terminar.",
  },
  kept: {
    title: "O Gabarito foi mantido",
    text: "A análise não encontrou evidência para trocá-lo.",
  },
  corrected: {
    title: "O Gabarito foi corrigido",
    text: "Sua Resposta passou a acerto e o Desempenho foi recalculado.",
  },
  voided: {
    title: "A Pergunta foi anulada",
    text: "Não havia evidência suficiente para confirmar um Gabarito. Ela saiu do Desempenho e das Revisões.",
  },
};

export interface ContestationStatusProps {
  status: ContestationOutcome;
  /** A justificativa do juiz, com a evidência. Aparece depois que a análise termina. */
  justification?: ReactNode;
  /** O que o usuário escreveu. Opcional. */
  argument?: ReactNode;
  /** Data do desfecho ("22/11"). */
  date?: string;
  className?: string;
}

/** Situação de uma Contestação, em fundo claro (banco de Perguntas, histórico). No painel de correção, use a linha do `CorrectionPanel`. */
export function ContestationStatus({ status, justification, argument, date, className }: ContestationStatusProps) {
  const copy = COPY[status];
  const showJustification = justification && status !== "reviewing";
  return (
    <motion.section
      className={["contest-status", className].filter(Boolean).join(" ")}
      aria-label="Contestação"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition.soft}
    >
      <header className="contest-status__head">
        <StatusTag status={status} />
        {date && <span className="contest-status__date">{date}</span>}
      </header>
      <div role="status" className="contest-status__body">
        <h4 className="contest-status__title">{copy.title}</h4>
        <p className="contest-status__text">{copy.text}</p>
      </div>
      {showJustification && (
        <div className="contest-status__block">
          <h5 className="contest-status__label">Justificativa</h5>
          <p className="contest-status__quote">{justification}</p>
        </div>
      )}
      {argument && (
        <div className="contest-status__block">
          <h5 className="contest-status__label">Seu argumento</h5>
          <p className="contest-status__quote">{argument}</p>
        </div>
      )}
    </motion.section>
  );
}
