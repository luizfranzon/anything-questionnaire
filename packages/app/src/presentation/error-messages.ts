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
  ROUND_NOT_FOUND: "Essa Rodada não existe mais.",
  ROUND_COUNT_INVALID: "Use de 1 a 100 Perguntas.",
  NO_ACTIVE_TOPICS: "Aprove ou reative ao menos um Tópico para criar uma Rodada.",
  TOPIC_NOT_IN_STUDY: "Um dos Tópicos escolhidos não está mais ativo.",
  ROUND_NOT_READY: "A Rodada ainda está sendo gerada.",
  ROUND_NOT_COMPLETED: "A Rodada ainda não terminou.",
  QUESTION_NOT_IN_ROUND: "Essa Pergunta não faz parte da Rodada.",
  ALTERNATIVE_NOT_FOUND: "Essa Alternativa não existe.",
  ALREADY_ANSWERED: "Você já respondeu essa Pergunta.",
  NOT_ANSWERED: "Responda a Pergunta primeiro.",
  CONFIDENCE_NOT_APPLICABLE: "A Confiança só vale para acertos.",
  CONFIDENCE_REQUIRED: "Marque a Confiança antes de responder.",
  CONFIDENCE_GIVEN_WITH_ANSWER: "No simulado, a Confiança é enviada junto com a Resposta.",
};

export const GENERIC_SAVE_ERROR = "Não foi possível gravar. Confira se o aplicativo está rodando e tente de novo.";

export function messageFor(code: DomainErrorCode): string {
  return MESSAGES[code];
}
