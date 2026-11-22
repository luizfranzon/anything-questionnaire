import type { DomainErrorCode } from "@anything-questionnaire/engine";

/** User-facing texts (pt-BR) for each domain error code. The code stays English. */
const MESSAGES: Record<DomainErrorCode, string> = {
  NAME_REQUIRED: "Dê um nome ao Estudo.",
  NAME_TOO_LONG: "O nome é longo demais.",
  GOAL_REQUIRED: "Descreva o Objetivo para o Claude propor os Tópicos.",
  GOAL_TOO_LONG: "O Objetivo é longo demais.",
  STUDY_NOT_FOUND: "Esse Estudo não existe mais.",
  TOPICS_REQUIRED: "Mantenha pelo menos um Tópico.",
  TOPIC_NAME_REQUIRED: "Dê um nome a cada Tópico.",
  TOPIC_NAME_TOO_LONG: "Há um nome de Tópico longo demais.",
  TOPIC_NAME_DUPLICATE: "Há dois Tópicos com o mesmo nome.",
  PROPOSAL_NOT_FOUND: "Essa proposta não existe mais.",
  PROPOSAL_NOT_READY: "A proposta ainda está sendo gerada.",
};

export const GENERIC_SAVE_ERROR = "Não foi possível gravar. Confira se o aplicativo está rodando e tente de novo.";

export function messageFor(code: DomainErrorCode): string {
  return MESSAGES[code];
}
