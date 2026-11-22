import { DomainError } from "./errors";

export const TOPIC_NAME_MAX_LENGTH = 80;

export interface Topic {
  id: string;
  studyId: string;
  name: string;
}

export type ProposalPhase = "generating" | "retrying" | "failed" | "ready";

export interface TopicProposal {
  id: string;
  studyId: string;
  phase: ProposalPhase;
  /** Empty until the proposal is ready. */
  topics: string[];
}

const key = (name: string) => name.toLowerCase(); // same folding as the database's lower() unique index

/** Cleans what Claude proposed: trims, and drops empty, over-long and duplicate names. */
export function normalizeProposedTopics(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (!name || name.length > TOPIC_NAME_MAX_LENGTH || seen.has(key(name))) continue;
    seen.add(key(name));
    result.push(name);
  }
  return result;
}

/** Validates the final list the user approved. Never silently drops anything. */
export function validateApprovedTopics(names: string[]): string[] {
  if (names.length === 0) throw new DomainError("TOPICS_REQUIRED");
  const seen = new Set<string>();
  return names.map((raw) => {
    const name = raw.trim();
    if (!name) throw new DomainError("TOPIC_NAME_REQUIRED");
    if (name.length > TOPIC_NAME_MAX_LENGTH) throw new DomainError("TOPIC_NAME_TOO_LONG");
    if (seen.has(key(name))) throw new DomainError("TOPIC_NAME_DUPLICATE");
    seen.add(key(name));
    return name;
  });
}
