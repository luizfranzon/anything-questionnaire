import type { DomainErrorCode } from "@anything-questionnaire/engine";

/** User-facing texts (pt-BR) for each domain error code. The code stays English. */
const MESSAGES: Record<DomainErrorCode, string> = {
  NAME_REQUIRED: "Dê um nome ao Estudo.",
  NAME_TOO_LONG: "O nome é longo demais.",
  GOAL_REQUIRED: "Descreva o Objetivo para o Claude propor os Tópicos.",
  GOAL_TOO_LONG: "O Objetivo é longo demais.",
  STUDY_NOT_FOUND: "Esse Estudo não existe mais.",
};

export const GENERIC_SAVE_ERROR = "Não foi possível gravar. Confira se o aplicativo está rodando e tente de novo.";

export function messageFor(code: DomainErrorCode): string {
  return MESSAGES[code];
}
