import { DomainError } from "./errors";

export const STUDY_NAME_MAX_LENGTH = 120;
export const STUDY_GOAL_MAX_LENGTH = 600;

export interface Study {
  id: string;
  name: string;
  goal: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyDetails {
  name: string;
  goal: string;
}

/** Normalizes and validates the editable fields of a Study. */
export function validateStudyDetails(input: StudyDetails): StudyDetails {
  const name = input.name.trim();
  const goal = input.goal.trim();
  if (!name) throw new DomainError("NAME_REQUIRED");
  if (name.length > STUDY_NAME_MAX_LENGTH) throw new DomainError("NAME_TOO_LONG");
  if (!goal) throw new DomainError("GOAL_REQUIRED");
  if (goal.length > STUDY_GOAL_MAX_LENGTH) throw new DomainError("GOAL_TOO_LONG");
  return { name, goal };
}
