import { randomUUID } from "node:crypto";
import { DomainError } from "../../domain/errors";
import {
  toNewQuestion,
  type NewQuestion,
  type Correction,
  type CorrectionItem,
  type NextQuestion,
  type RoundHistoryEntry,
  type RoundResult,
  type RoundReview,
} from "../../domain/question";
import {
  distributeEvenly,
  interleave,
  validateRoundCount,
  type AnswerOutcome,
  type Confidence,
  type Round,
  type RoundPhase,
  type RoundSettings,
} from "../../domain/round";
import {
  PERFORMANCE_DEFAULTS,
  allocateQuestions,
  difficultyFor,
  measureTopic,
  sortWeakestFirst,
  type Difficulty,
  type Random,
  type TopicPerformance,
} from "../../domain/performance";
import { reviewSlots, scheduleFromHistory, shuffleWith } from "../../domain/review";
import type { Stage, UsageRecord } from "../../domain/usage";
import type { ClaudeGateway } from "../ports/claude-gateway";
import type { Clock } from "../ports/clock";
import type { JobQueue } from "../ports/job-queue";
import type { RoundPlan, RoundRepository, StoredRound, StoredRoundQuestion } from "../ports/round-ports";
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
  modelFor: (stage: Stage) => Promise<string>;
  /** Throws CREDENTIAL_REQUIRED when there is no Credential, so work that needs Claude is not queued to fail. */
  requireCredential: () => Promise<void>;
  clock: Clock;
  /** Source of randomness for drawing Topics; replaced in tests. */
  random?: Random;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function toCorrection(question: StoredRoundQuestion, outcome: AnswerOutcome, confidence: Confidence | null): Correction {
  return {
    outcome,
    correctAlternativeId: question.answerKey,
    explanations: Object.fromEntries(question.alternatives.map((a) => [a.id, a.explanation])),
    confidence,
  };
}

export function createRoundUseCases({
  studies,
  topics,
  rounds,
  usage,
  queue,
  claude,
  modelFor,
  requireCredential,
  clock,
  random = Math.random,
}: Deps) {
  const settings = { ...PERFORMANCE_DEFAULTS };

  async function measureTopics(studyId: string, active: Array<{ id: string; name: string }>): Promise<TopicPerformance[]> {
    const history = await rounds.listAnswerHistory(studyId);
    return active.map((topic) => measureTopic(topic, history, settings));
  }

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

  /** The answered Questions of a Round in presented order, each with its correction. */
  async function correctionItems(roundId: string): Promise<CorrectionItem[]> {
    const [questions, answers] = await Promise.all([rounds.listQuestions(roundId), rounds.listAnswers(roundId)]);
    const byQuestion = new Map(answers.map((a) => [a.questionId, a]));
    return questions.flatMap((q, i) => {
      const answer = byQuestion.get(q.id);
      if (!answer) return [];
      return [
        {
          ...toCorrection(q, answer.outcome, answer.confidence),
          position: i + 1,
          question: {
            id: q.id,
            topic: q.topicName,
            format: q.format,
            prompt: q.prompt,
            alternatives: q.alternatives.map(({ id, text }) => ({ id, text })),
          },
          pickedId: answer.response,
        },
      ];
    });
  }

  /** Recomputes the Question's FSRS state from every Answer it has received. */
  async function reschedule(questionId: string): Promise<void> {
    const card = scheduleFromHistory(await rounds.listQuestionAnswers(questionId));
    if (card) await rounds.saveReview(questionId, card.due, JSON.parse(JSON.stringify(card)));
  }

  /** Keeps only the Questions whose blind answer matches the Gabarito. One call for the whole batch. */
  async function verifyBlind(studyId: string, roundId: string, batch: NewQuestion[]): Promise<NewQuestion[]> {
    if (batch.length === 0) return [];
    const { output, model, usage: tokens } = await claude.resolveBlind({
      model: await modelFor("blind-resolution"),
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
    // The plan was drawn when the Round was created, so a retry keeps asking for the same thing.
    const plan: RoundPlan =
      round.plan ??
      distributeEvenly(round.count, chosen.length).map((count, i) => ({
        topicId: chosen[i].id,
        count,
        difficulty: "medium" as Difficulty,
      }));

    // Questions saved by an earlier attempt count, so a retry only writes what is still missing.
    const existing = (await rounds.listQuestions(round.id)).filter((q) => !q.review);

    for (const { topicId, count: target, difficulty } of plan) {
      const topic = chosen.find((t) => t.id === topicId);
      // An archived Topic would leave the Round short of its count; fail visibly instead of finishing incomplete.
      if (!topic) throw new Error("A Topic of the Round plan is no longer active");
      let missing = target - existing.filter((q) => q.topicId === topic.id).length;
      let calls = 0;
      const maxCalls = Math.ceil(target / GENERATION_BATCH_SIZE) + GENERATION_EXTRA_ATTEMPTS;
      while (missing > 0) {
        if (calls++ >= maxCalls) throw new Error(`Claude did not produce enough verified Questions for "${topic.name}"`);
        const asked = Math.min(missing, GENERATION_BATCH_SIZE);
        const { output, model, usage: tokens } = await claude.generateQuestions({
          model: await modelFor("question-generation"),
          studyId: study.id,
          roundId: round.id,
          goal: study.goal,
          topic: { id: topic.id, name: topic.name },
          difficulty,
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
          .map((raw) => toNewQuestion(topic.id, raw, difficulty, randomUUID, shuffle))
          .filter((q) => q !== null)
          .slice(0, asked);

        // Blind resolution: a separate call that sees no Gabarito. Questions it disagrees with are dropped.
        const approved = await verifyBlind(study.id, round.id, valid);
        await rounds.addQuestions(round, approved);
        missing -= approved.length;
      }
    }

    const all = await rounds.listQuestions(round.id);
    const generated = all.filter((q) => !q.review);
    const byTopic = plan.map(({ topicId }) => topicId).map((id) => generated.filter((q) => q.topicId === id).map((q) => q.id));
    // Revisões come first; what was generated for the Round follows, Topics alternating.
    await rounds.markReady(round.id, [...all.filter((q) => q.review).map((q) => q.id), ...interleave(byTopic)]);
  }

  return {
    /** Queues the generation of a Round. It only becomes ready when every requested Question exists. */
    async createRound(studyId: string, roundSettings: RoundSettings): Promise<Round> {
      const count = validateRoundCount(roundSettings.count);
      if (!(await studies.findById(studyId))) throw new DomainError("STUDY_NOT_FOUND");
      await requireCredential();

      const active = await topics.findActiveByStudy(studyId);
      if (active.length === 0) throw new DomainError("NO_ACTIVE_TOPICS");
      const requested = roundSettings.topicIds?.length ? roundSettings.topicIds : null;
      if (requested && !requested.every((id) => active.some((t) => t.id === id))) {
        throw new DomainError("TOPIC_NOT_IN_STUDY");
      }

      const candidates = requested ? active.filter((t) => requested.includes(t.id)) : active;
      // Due Revisões take their places first, up to their share of the Round; new Questions fill the rest.
      const reviewIds = await rounds.listDueReviews(studyId, clock.now(), {
        topicIds: candidates.map((t) => t.id),
        limit: reviewSlots(count),
      });
      const measured = await measureTopics(studyId, candidates);
      const allocation = allocateQuestions(count - reviewIds.length, measured, random, settings);
      const plan: RoundPlan = measured.flatMap((m, i) =>
        allocation[i] > 0 ? [{ topicId: m.topicId, count: allocation[i], difficulty: difficultyFor(m.performance, settings) }] : [],
      );

      const created = await rounds.insert(studyId, {
        count,
        mode: roundSettings.mode ?? "study",
        topicIds: requested,
        plan,
        createdAt: clock.now(),
      });
      await rounds.attachReviews(created, reviewIds);
      const jobId = await queue.enqueue(created.id);
      await rounds.setJobId(created.id, jobId);
      return toRound({ ...created, jobId });
    },

    /** The active Topics of a Study with their Desempenho, never-asked first, then weakest to strongest. */
    async listTopicPerformance(studyId: string): Promise<TopicPerformance[]> {
      if (!(await studies.findById(studyId))) throw new DomainError("STUDY_NOT_FOUND");
      return sortWeakestFirst(await measureTopics(studyId, await topics.findActiveByStudy(studyId)));
    },

    /** How many Revisões are due right now. */
    async countDueReviews(studyId: string): Promise<number> {
      if (!(await studies.findById(studyId))) throw new DomainError("STUDY_NOT_FOUND");
      return rounds.countDueReviews(studyId, clock.now());
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
          // Shuffled on every presentation so position never gives the answer away.
          alternatives: shuffleWith(q.alternatives, random).map(({ id, text }) => ({ id, text })),
        },
      };
    },

    /**
     * Records the Answer right away. `choice: null` is "Não sei" and counts as a mistake. In study mode the
     * correction comes back immediately. In mock mode the Confidence must come with the Answer and nothing is
     * returned (`null`): the correction is only released by `getRoundCorrection` once the Round ends.
     */
    async answerQuestion(
      roundId: string,
      questionId: string,
      input: { choice: string | null; confidence?: Confidence },
    ): Promise<Correction | null> {
      const round = await requireReadyRound(roundId);
      const { mode } = round;
      const questions = await rounds.listQuestions(roundId);
      const question = questions.find((q) => q.id === questionId);
      if (!question) throw new DomainError("QUESTION_NOT_IN_ROUND");
      if ((await rounds.listAnswers(roundId)).some((a) => a.questionId === questionId)) {
        throw new DomainError("ALREADY_ANSWERED");
      }
      if (input.choice !== null && !question.alternatives.some((a) => a.id === input.choice)) {
        throw new DomainError("ALTERNATIVE_NOT_FOUND");
      }
      if (mode === "mock" && input.choice !== null && !input.confidence) throw new DomainError("CONFIDENCE_REQUIRED");

      const outcome = input.choice === question.answerKey ? "correct" : "incorrect";
      // Study mode only asks for Confidence after a correct Answer. Mock mode collects it with every Answer
      // (the user does not know yet), so it is kept for wrong ones too; it never affects their grade.
      const confidence =
        mode === "mock" ? (input.choice === null ? null : (input.confidence ?? null)) : outcome === "correct" ? (input.confidence ?? null) : null;
      await rounds.insertAnswer(roundId, {
        questionId,
        response: input.choice,
        outcome,
        confidence,
        answeredAt: clock.now(),
      });
      if (mode === "study") {
        await reschedule(questionId);
        return toCorrection(question, outcome, confidence);
      }
      // Mock mode: the Revisões schedule only moves once the Round ends, or the due count would reveal the outcome.
      const done = await rounds.listAnswers(roundId);
      if (done.length >= round.count) for (const { questionId: id } of done) await reschedule(id);
      return null;
    },

    /** Records whether the user was sure or doubtful about a correct Answer. Study mode only. */
    async setAnswerConfidence(roundId: string, questionId: string, confidence: Confidence): Promise<void> {
      const { mode } = await requireReadyRound(roundId);
      // Refused before looking at the Answer: telling "wrong" apart from "right" would leak the outcome.
      if (mode === "mock") throw new DomainError("CONFIDENCE_GIVEN_WITH_ANSWER");
      const answer = (await rounds.listAnswers(roundId)).find((a) => a.questionId === questionId);
      if (!answer) throw new DomainError("NOT_ANSWERED");
      if (answer.outcome !== "correct") throw new DomainError("CONFIDENCE_NOT_APPLICABLE");
      await rounds.setConfidence(roundId, questionId, confidence);
      await reschedule(questionId);
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

    /** Every Question with the user's Answer, Gabarito and Explicações. Only once the Round has ended. */
    async getRoundCorrection(roundId: string): Promise<CorrectionItem[]> {
      const round = await toRound(await requireReadyRound(roundId));
      if (round.phase !== "completed") throw new DomainError("ROUND_NOT_COMPLETED");
      return correctionItems(roundId);
    },

    /** The Study's Rounds that have at least one Answer, most recent first. */
    async listRoundHistory(studyId: string): Promise<RoundHistoryEntry[]> {
      if (!(await studies.findById(studyId))) throw new DomainError("STUDY_NOT_FOUND");
      const entries = await Promise.all(
        (await rounds.listByStudy(studyId))
          .filter((r) => r.status === "ready")
          .map(async (r): Promise<RoundHistoryEntry | null> => {
            const answers = await rounds.listAnswers(r.id);
            if (answers.length === 0) return null;
            // A mock Round keeps its hits secret until the last Answer.
            const revealed = r.mode === "study" || answers.length >= r.count;
            return {
              id: r.id,
              date: r.createdAt,
              mode: r.mode,
              total: r.count,
              answered: answers.length,
              correct: revealed ? answers.filter((a) => a.outcome === "correct").length : null,
            };
          }),
      );
      return entries.filter((e) => e !== null);
    },

    /** A past Round question by question. Study mode shows what was answered so far; mock mode only once it ends. */
    async getRoundReview(roundId: string): Promise<RoundReview> {
      const stored = await requireReadyRound(roundId);
      const items = await correctionItems(roundId);
      if (stored.mode === "mock" && items.length < stored.count) throw new DomainError("ROUND_NOT_COMPLETED");
      return { date: stored.createdAt, mode: stored.mode, total: stored.count, items };
    },

    startWorker(): Promise<void> {
      return queue.work(processRound);
    },

    drainJobs(): Promise<void> {
      return queue.drain();
    },
  };
}
