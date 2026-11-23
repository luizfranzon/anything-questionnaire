import type { Topic } from "../../domain/topic";
import type { Stage, UsageRecord } from "../../domain/usage";

export interface StoredProposal {
  id: string;
  studyId: string;
  jobId: string | null;
  /** `null` until Claude answered. */
  topics: string[] | null;
}

export interface ProposalRepository {
  /** Creates a pending proposal (no job yet). */
  insert(studyId: string): Promise<StoredProposal>;
  findByStudy(studyId: string): Promise<StoredProposal | null>;
  findById(id: string): Promise<StoredProposal | null>;
  setJobId(id: string, jobId: string): Promise<void>;
  setTopics(id: string, topics: string[]): Promise<void>;
  delete(id: string): Promise<void>;
  /** Atomically stores the approved Topics in the Study and removes the proposal. */
  approve(proposal: StoredProposal, names: string[]): Promise<Topic[]>;
}

export interface TopicRepository {
  findActiveByStudy(studyId: string): Promise<Topic[]>;
}

export interface UsageFilter {
  studyId?: string;
  stage?: Stage;
  from?: Date;
  to?: Date;
}

export interface UsageRepository {
  insert(record: UsageRecord): Promise<void>;
  /** Every given filter must match; `from` and `to` are inclusive. */
  find(filter: UsageFilter): Promise<UsageRecord[]>;
}
