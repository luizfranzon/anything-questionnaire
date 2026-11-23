import { DomainError } from "../../domain/errors";
import {
  normalizeProposedTopics,
  validateApprovedTopics,
  type ProposalPhase,
  type Topic,
  type TopicProposal,
} from "../../domain/topic";
import type { Stage, UsageRecord } from "../../domain/usage";
import type { ClaudeGateway } from "../ports/claude-gateway";
import type { Clock } from "../ports/clock";
import type { JobQueue } from "../ports/job-queue";
import type { StudyRepository } from "../ports/study-repository";
import type {
  ProposalRepository,
  StoredProposal,
  TopicRepository,
  UsageRepository,
} from "../ports/topic-proposal-ports";

interface Deps {
  studies: StudyRepository;
  proposals: ProposalRepository;
  topics: TopicRepository;
  usage: UsageRepository;
  queue: JobQueue;
  claude: ClaudeGateway;
  modelFor: (stage: Stage) => Promise<string>;
  /** Throws CREDENTIAL_REQUIRED when there is no Credential, so work that needs Claude is not queued to fail. */
  requireCredential: () => Promise<void>;
  clock: Clock;
}

export function createTopicProposalUseCases({
  studies,
  proposals,
  topics,
  usage,
  queue,
  claude,
  modelFor,
  requireCredential,
  clock,
}: Deps) {
  async function toProposal(stored: StoredProposal): Promise<TopicProposal> {
    const base = { id: stored.id, studyId: stored.studyId };
    if (stored.topics) return { ...base, phase: "ready", topics: stored.topics };
    const job = stored.jobId ? await queue.phaseOf(stored.jobId) : "failed";
    const phase: ProposalPhase =
      // A completed job that left no Topics (e.g. its record vanished) must not poll forever.
      job === "failed" || job === "completed" ? "failed" : job === "retrying" ? "retrying" : "generating";
    return { ...base, phase, topics: [] };
  }

  /** Job handler: asks Claude for the Topics and stores the proposal. Throwing makes the queue retry. */
  async function processProposal(proposalId: string): Promise<void> {
    const proposal = await proposals.findById(proposalId);
    if (!proposal || proposal.topics) return;
    const study = await studies.findById(proposal.studyId);
    if (!study) return;

    const { output, model, usage: tokens } = await claude.extractTopics({
      studyId: study.id,
      goal: study.goal,
      model: await modelFor("topic-extraction"),
    });

    const record: UsageRecord = {
      stage: "topic-extraction",
      model,
      studyId: study.id,
      roundId: null,
      ...tokens,
      createdAt: clock.now(),
    };
    await usage.insert(record);
    await proposals.setTopics(proposal.id, normalizeProposedTopics(output.topics));
  }

  return {
    /** Asks for a Topic proposal. Reuses one that is in flight or ready; replaces one that failed. */
    async requestTopicProposal(studyId: string): Promise<TopicProposal> {
      if (!(await studies.findById(studyId))) throw new DomainError("STUDY_NOT_FOUND");
      await requireCredential();

      const existing = await proposals.findByStudy(studyId);
      if (existing) {
        const current = await toProposal(existing);
        if (current.phase !== "failed") return current;
        await proposals.delete(existing.id);
      }

      const created = await proposals.insert(studyId);
      const jobId = await queue.enqueue(created.id);
      await proposals.setJobId(created.id, jobId);
      return toProposal({ ...created, jobId });
    },

    async getTopicProposal(studyId: string): Promise<TopicProposal | null> {
      const stored = await proposals.findByStudy(studyId);
      return stored ? toProposal(stored) : null;
    },

    /** Stores exactly the Topics the user approved (after editing) and discards the proposal. */
    async approveTopicProposal(studyId: string, names: string[]): Promise<Topic[]> {
      const stored = await proposals.findByStudy(studyId);
      if (!stored) throw new DomainError("PROPOSAL_NOT_FOUND");
      if (!stored.topics) throw new DomainError("PROPOSAL_NOT_READY");
      return proposals.approve(stored, validateApprovedTopics(names));
    },

    listTopics(studyId: string): Promise<Topic[]> {
      return topics.findActiveByStudy(studyId);
    },

    listUsageRecords(filter: { studyId?: string } = {}): Promise<UsageRecord[]> {
      return usage.find(filter);
    },

    /** Starts the background worker. */
    startWorker(): Promise<void> {
      return queue.work(processProposal);
    },

    /** Runs all ready jobs, including retries, to completion. Meant for tests and scripts. */
    drainJobs(): Promise<void> {
      return queue.drain();
    },
  };
}
