export type DomainErrorCode =
  | "NAME_REQUIRED"
  | "NAME_TOO_LONG"
  | "GOAL_REQUIRED"
  | "GOAL_TOO_LONG"
  | "STUDY_NOT_FOUND"
  | "TOPICS_REQUIRED"
  | "TOPIC_NAME_REQUIRED"
  | "TOPIC_NAME_TOO_LONG"
  | "TOPIC_NAME_DUPLICATE"
  | "PROPOSAL_NOT_FOUND"
  | "PROPOSAL_NOT_READY";

/** A business rule was violated. Carries a stable code; presentation decides the user-facing text. */
export class DomainError extends Error {
  constructor(public readonly code: DomainErrorCode) {
    super(code);
    this.name = "DomainError";
  }
}
