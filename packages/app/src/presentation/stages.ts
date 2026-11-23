import type { Stage } from "@anything-questionnaire/engine";

/** The screens name Stages by short ids; the engine uses its own. */
export const STAGE_BY_SCREEN_ID: Record<string, Stage> = {
  topics: "topic-extraction",
  chunks: "excerpt-classification",
  generate: "question-generation",
  blind: "blind-resolution",
  contest: "contestation-judgment",
};
