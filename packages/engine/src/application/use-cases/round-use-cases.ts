import { randomUUID } from "node:crypto";
import { DomainError } from "../../domain/errors";
import {
  toNewQuestion,
  type NewQuestion,
  type Correction,
  type NextQuestion,
  type RoundResult,
} from "../../domain/question";
import {
  distributeEvenly,
  interleave,
  validateRoundCount,
  type Confidence,
  type Round,
  type RoundPhase,
  type RoundSettings,
} from "../../domain/round";
import type { UsageRecord } from "../../domain/usage";
import type { ClaudeGateway } from "../ports/claude-gateway";
import type { Clock } from "../ports/clock";
import type { JobQueue } from "../ports/job-queue";
import type { RoundRepository, StoredRound } from "../ports/round-ports";
import type { StudyRepository } from "../ports/study-repository";
import type { TopicRepository, UsageRepository } from "../ports/topic-proposal-ports";

/** Questions asked of Claude per call. Keeps responses small and lets progress show up as it goes. */
export const GENERATION_BATCH_SIZE = 10;
/** Extra calls tolerated per Topic beyond the minimum, to make up for malformed Questions. */
const GENERATION_EXTRA_ATTEMPTS = 2;

interface Deps {
  studies: StudyRepository;
  topics: TopicRepository;
  rounds: RoundRepository;
  usage: UsageRepository;
  queue: JobQueue;
  claude: ClaudeGateway;
  clock: Clock;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createRoundUseCases({ studies, topics, rounds, usage, queue, claude, clock }: Deps) {
  async function requireRound(id: string): Promise<StoredRound> {
    const round = await rounds.findById(id);
    if (!round) throw new DomainError("ROUND_NOT_FOUND");
    return round;
  }

  async function requireReadyRound(id: string): Promise<StoredRound> {
    const round = await requireRound(id);
    if (round.status !== "ready") throw new DomainError("ROUND_NOT_READY");
    return round;
  }

  async function toRound(stored: StoredRound): Promise<Round> {
    const [generated, answered] = await Promise.all([rounds.listQuestions(stored.id), rounds.listAnswers(stored.id)]);
    let phase: RoundPhase;
    if (stored.status === "ready") {
      phase = answered.length === 0 ? "ready" : answered.length < stored.count ? "in-progress" : "completed";
    } else {
      const job = stored.jobId ? await queue.phaseOf(stored.jobId) : "failed";
      // A completed job that left the Round unfinished must not poll forever.
      phase = job === "failed" || job === "completed" ? "failed" : job === "retrying" ? "retrying" : "generating";
    }
    return {
      id: stored.id,
      studyId: stored.studyId,
      mode: stored.mode,
      count: stored.count,
      phase,
      generated: generated.length,
      answered: answered.length,
    };
  }

  /** Keeps only the Questions whose blind answer matches the Gabarito. One call for the whole batch. */
  async function verifyBlind(studyId: string, roundId: string, batch: NewQuestion[]): Promise<NewQuestion[]> {
    if (batch.length === 0) return [];
    const { output, model, usage: tokens } = await claude.resolveBlind({
      studyId,
      roundId,
      questions: batch.map((q) => ({ prompt: q.prompt, alternatives: q.alternatives.map((a) => a.text) })),
    });
    await usage.insert({ stage: "blind-resolution", model, studyId, roundId, ...tokens, createdAt: clock.now() });
    return batch.filter((q, i) => {
      const chosen = output.answers[i];
      return chosen !== null && chosen !== undefined && q.alternatives[chosen]?.id === q.answerKey;
    });
  }

  /** Job handler: writes the missing Questions of each Topic, then releases the Round. Throwing makes the queue retry. */
  async function processRound(roundId: string): Promise<void> {
    const round = await rounds.findById(roundId);
    if (!round || round.status === "ready") return;
    const study = await studies.findById(round.studyId);
    if (!study) return;

    const active = await topics.findActiveByStudy(study.id);
    const chosen = round.topicIds ? active.filter((t) => round.topicIds!.includes(t.id)) : active;
    if (chosen.length === 0) throw new Error("The Round has no active Topics left");
    const targets = distributeEvenly(round.count, chosen.length);

    // Questions saved by an earlier attempt count, so a retry only writes what is still missing.
    const existing = await rounds.listQuestions(round.id);

    for (const [index, topic] of chosen.entries()) {
      const target = targets[index];
      let missing = target - existing.filter((q) => q.topicId === topic.id).length;
      let calls = 0;
      const maxCalls = Math.ceil(target / GENERATION_BATCH_SIZE) + GENERATION_EXTRA_ATTEMPTS;
      while (missing > 0) {
        if (calls++ >= maxCalls) throw new Error(`Claude did not produce enough verified Questions for "${topic.name}"`);
        const asked = Math.min(missing, GENERATION_BATCH_SIZE);
        const { output, model, usage: tokens } = await claude.generateQuestions({
          studyId: study.id,
          roundId: round.id,
          goal: study.goal,
          topic: { id: topic.id, name: topic.name },
          count: asked,
        });
        const record: UsageRecord = {
          stage: "question-generation",
          model,
          studyId: study.id,
          roundId: round.id,
          ...tokens,
          createdAt: clock.now(),
        };
        await usage.insert(record);

        const valid = output.questions
          .map((raw) => toNewQuestion(topic.id, raw, randomUUID, shuffle))
          .filter((q) => q !== null)
          .slice(0, asked);

        // Blind resolution: a separate call that sees no Gabarito. Questions it disagrees with are dropped.
        const approved = await verifyBlind(study.id, round.id, valid);
        await rounds.addQuestions(round, approved);
        missing -= approved.length;
      }
    }

    const all = await rounds.listQuestions(round.id);
    const byTopic = chosen.map((t) => all.filter((q) => q.topicId === t.id).map((q) => q.id));
    await rounds.markReady(round.id, interleave(byTopic));
  }

  return {
    /** Queues the generation of a Round. It only becomes ready when every requested Question exists. */
    async createRound(studyId: string, settings: RoundSettings): Promise<Round> {
      const count = validateRoundCount(settings.count);
      if (!(await studies.findById(studyId))) throw new DomainError("STUDY_NOT_FOUND");

      const active = await topics.findActiveByStudy(studyId);
      if (active.length === 0) throw new DomainError("NO_ACTIVE_TOPICS");
      const requested = settings.topicIds?.length ? settings.topicIds : null;
      if (requested && !requested.every((id) => active.some((t) => t.id === id))) {
        throw new DomainError("TOPIC_NOT_IN_STUDY");
      }

      const created = await rounds.insert(studyId, { count, mode: settings.mode ?? "study", topicIds: requested });
      const jobId = await queue.enqueue(created.id);
      await rounds.setJobId(created.id, jobId);
      return toRound({ ...created, jobId });
    },

    async getRound(roundId: string): Promise<Round> {
      return toRound(await requireRound(roundId));
    },

    /** The first Question not answered yet, or null when the Round has been fully answered. */
    async getNextQuestion(roundId: string): Promise<NextQuestion | null> {
      await requireReadyRound(roundId);
      const [questions, answers] = await Promise.all([rounds.listQuestions(roundId), rounds.listAnswers(roundId)]);
      const answered = new Set(answers.map((a) => a.questionId));
      const index = questions.findIndex((q) => !answered.has(q.id));
      if (index === -1) return null;
      const q = questions[index];
      return {
        position: index + 1,
        total: questions.length,
        question: {
          id: q.id,
          topic: q.topicName,
          format: q.format,
          prompt: q.prompt,
          alternatives: q.alternatives.map(({ id, text }) => ({ id, text })),
        },
      };
    },

    /**
     * Records the Answer right away. `choice: null` is "Não sei" and counts as a mistake. In study mode the
     * correction comes back immediately.
     */
    async answerQuestion(
      roundId: string,
      questionId: string,
      input: { choice: string | null; confidence?: Confidence },
    ): Promise<Correction> {
      await requireReadyRound(roundId);
      const questions = await rounds.listQuestions(roundId);
      const question = questions.find((q) => q.id === questionId);
      if (!question) throw new DomainError("QUESTION_NOT_IN_ROUND");
      if ((await rounds.listAnswers(roundId)).some((a) => a.questionId === questionId)) {
        throw new DomainError("ALREADY_ANSWERED");
      }
      if (input.choice !== null && !question.alternatives.some((a) => a.id === input.choice)) {
        throw new DomainError("ALTERNATIVE_NOT_FOUND");
      }

      const outcome = input.choice === question.answerKey ? "correct" : "incorrect";
      // Confidence is only asked after a correct Answer; for anything else it stays empty.
      const confidence = outcome === "correct" ? (input.confidence ?? null) : null;
      await rounds.insertAnswer(roundId, {
        questionId,
        response: input.choice,
        outcome,
        confidence,
        answeredAt: clock.now(),
      });
      return {
        outcome,
        correctAlternativeId: question.answerKey,
        explanations: Object.fromEntries(question.alternatives.map((a) => [a.id, a.explanation])),
        confidence,
      };
    },

    /** Records whether the user was sure or doubtful about a correct Answer. */
    async setAnswerConfidence(roundId: string, questionId: string, confidence: Confidence): Promise<void> {
      await requireReadyRound(roundId);
      const answer = (await rounds.listAnswers(roundId)).find((a) => a.questionId === questionId);
      if (!answer) throw new DomainError("NOT_ANSWERED");
      if (answer.outcome !== "correct") throw new DomainError("CONFIDENCE_NOT_APPLICABLE");
      await rounds.setConfidence(roundId, questionId, confidence);
    },

    /** Hits out of total, once every Question of the Round has been answered. */
    async getRoundResult(roundId: string): Promise<RoundResult> {
      const round = await toRound(await requireReadyRound(roundId));
      if (round.phase !== "completed") throw new DomainError("ROUND_NOT_COMPLETED");
      const answers = await rounds.listAnswers(roundId);
      return {
        correct: answers.filter((a) => a.outcome === "correct").length,
        total: round.count,
        dontKnow: answers.filter((a) => a.response === null).length,
      };
    },

    startWorker(): Promise<void> {
      return queue.work(processRound);
    },

    drainJobs(): Promise<void> {
      return queue.drain();
    },
  };
}
