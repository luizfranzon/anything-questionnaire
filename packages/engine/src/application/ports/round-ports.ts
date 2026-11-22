import type { NewQuestion } from "../../domain/question";
import type { AnswerRecord, Difficulty } from "../../domain/performance";
import type { AnswerOutcome, Confidence, RoundMode } from "../../domain/round";
import type { ReviewAnswer } from "../../domain/review";

export type RoundPlan = Array<{ topicId: string; count: number; difficulty: Difficulty }>;

export interface StoredRound {
  id: string;
  studyId: string;
  mode: RoundMode;
  count: number;
  /** `null`: every active Topic. */
  topicIds: string[] | null;
  /** `null` on Rounds created before the plan existed: even split, medium Dificuldade. */
  plan: RoundPlan | null;
  status: "generating" | "ready";
  jobId: string | null;
}

export interface StoredRoundQuestion {
  id: string;
  topicId: string;
  topicName: string;
  format: "multiple-choice" | "open";
  prompt: string;
  alternatives: Array<{ id: string; text: string; explanation: string }>;
  answerKey: string;
  /** True when the Question is a Revisão in this Round rather than one generated for it. */
  review: boolean;
}

export interface StoredAnswer {
  questionId: string;
  response: string | null;
  outcome: AnswerOutcome;
  confidence: Confidence | null;
}

export interface RoundRepository {
  insert(
    studyId: string,
    settings: { count: number; mode: RoundMode; topicIds: string[] | null; plan: RoundPlan },
  ): Promise<StoredRound>;
  findById(id: string): Promise<StoredRound | null>;
  setJobId(id: string, jobId: string): Promise<void>;
  /** Stores the Questions and attaches them to the Round. */
  addQuestions(round: StoredRound, questions: NewQuestion[]): Promise<void>;
  /** The Round's Questions in presentation order. */
  listQuestions(roundId: string): Promise<StoredRoundQuestion[]>;
  /** Fixes the presentation order and marks the Round ready. */
  markReady(roundId: string, orderedQuestionIds: string[]): Promise<void>;
  insertAnswer(roundId: string, answer: Omit<StoredAnswer, "confidence"> & { confidence: Confidence | null; answeredAt: Date }): Promise<void>;
  setConfidence(roundId: string, questionId: string, confidence: Confidence): Promise<void>;
  listAnswers(roundId: string): Promise<StoredAnswer[]>;
  /** Every Answer given in the Study, each tagged with its Question's Topic. */
  listAnswerHistory(studyId: string): Promise<AnswerRecord[]>;
  /** Attaches already answered Questions to the Round as Revisões, ahead of anything generated for it. */
  attachReviews(round: StoredRound, questionIds: string[]): Promise<void>;
  /** Every Answer ever given to the Question. */
  listQuestionAnswers(questionId: string): Promise<ReviewAnswer[]>;
  saveReview(questionId: string, due: Date, card: Record<string, unknown>): Promise<void>;
  /**
   * Ids of the Questions due at `now`, most overdue first. Only active Questions of active Topics count;
   * `topicIds` narrows them to those Topics.
   */
  listDueReviews(studyId: string, now: Date, options?: { topicIds?: string[]; limit?: number }): Promise<string[]>;
  countDueReviews(studyId: string, now: Date): Promise<number>;
}
