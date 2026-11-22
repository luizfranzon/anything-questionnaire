import { and, asc, eq, inArray, lte, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { RoundRepository, StoredRound } from "../../application/ports/round-ports";
import { answers, questionReviews, questions, roundQuestions, rounds, topics } from "./schema";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toStored = (row: typeof rounds.$inferSelect): StoredRound => ({
  id: row.id,
  studyId: row.studyId,
  mode: row.mode,
  count: row.count,
  topicIds: row.topicIds,
  plan: row.plan,
  status: row.status,
  jobId: row.jobId,
});

export function createDrizzleRoundRepository(db: PostgresJsDatabase): RoundRepository {
  return {
    async insert(studyId, { count, mode, topicIds, plan }) {
      const [row] = await db.insert(rounds).values({ studyId, count, mode, topicIds, plan }).returning();
      return toStored(row);
    },

    async findById(id) {
      if (!UUID_PATTERN.test(id)) return null;
      const [row] = await db.select().from(rounds).where(eq(rounds.id, id));
      return row ? toStored(row) : null;
    },

    async setJobId(id, jobId) {
      await db.update(rounds).set({ jobId }).where(eq(rounds.id, id));
    },

    addQuestions(round, newQuestions) {
      if (newQuestions.length === 0) return Promise.resolve();
      return db.transaction(async (tx) => {
        const [{ next }] = await tx
          .select({ next: sql<number>`coalesce(max(${roundQuestions.position}), -1) + 1` })
          .from(roundQuestions)
          .where(eq(roundQuestions.roundId, round.id));
        const inserted = await tx
          .insert(questions)
          .values(newQuestions.map((q) => ({ ...q, studyId: round.studyId })))
          .returning({ id: questions.id });
        await tx
          .insert(roundQuestions)
          .values(inserted.map((q, i) => ({ roundId: round.id, questionId: q.id, position: Number(next) + i })));
      });
    },

    async listQuestions(roundId) {
      if (!UUID_PATTERN.test(roundId)) return [];
      const rows = await db
        .select({
          id: questions.id,
          topicId: questions.topicId,
          topicName: topics.name,
          format: questions.format,
          prompt: questions.prompt,
          alternatives: questions.alternatives,
          answerKey: questions.answerKey,
          review: roundQuestions.review,
        })
        .from(roundQuestions)
        .innerJoin(questions, eq(questions.id, roundQuestions.questionId))
        .innerJoin(topics, eq(topics.id, questions.topicId))
        .where(eq(roundQuestions.roundId, roundId))
        .orderBy(asc(roundQuestions.position));
      return rows;
    },

    markReady(roundId, orderedQuestionIds) {
      return db.transaction(async (tx) => {
        for (const [position, questionId] of orderedQuestionIds.entries()) {
          await tx
            .update(roundQuestions)
            .set({ position })
            .where(and(eq(roundQuestions.roundId, roundId), eq(roundQuestions.questionId, questionId)));
        }
        await tx.update(rounds).set({ status: "ready" }).where(eq(rounds.id, roundId));
      });
    },

    async insertAnswer(roundId, answer) {
      await db.insert(answers).values({ roundId, ...answer });
    },

    async setConfidence(roundId, questionId, confidence) {
      await db
        .update(answers)
        .set({ confidence })
        .where(and(eq(answers.roundId, roundId), eq(answers.questionId, questionId)));
    },

    async listAnswers(roundId) {
      if (!UUID_PATTERN.test(roundId)) return [];
      return db
        .select({
          questionId: answers.questionId,
          response: answers.response,
          outcome: answers.outcome,
          confidence: answers.confidence,
        })
        .from(answers)
        .where(eq(answers.roundId, roundId))
        .orderBy(asc(answers.answeredAt));
    },

    async listAnswerHistory(studyId) {
      if (!UUID_PATTERN.test(studyId)) return [];
      return db
        .select({
          topicId: questions.topicId,
          outcome: answers.outcome,
          confidence: answers.confidence,
          answeredAt: answers.answeredAt,
        })
        .from(answers)
        .innerJoin(questions, eq(questions.id, answers.questionId))
        .where(eq(questions.studyId, studyId));
    },

    attachReviews(round, questionIds) {
      if (questionIds.length === 0) return Promise.resolve();
      return db.transaction(async (tx) => {
        const [{ next }] = await tx
          .select({ next: sql<number>`coalesce(max(${roundQuestions.position}), -1) + 1` })
          .from(roundQuestions)
          .where(eq(roundQuestions.roundId, round.id));
        await tx
          .insert(roundQuestions)
          .values(questionIds.map((questionId, i) => ({ roundId: round.id, questionId, position: Number(next) + i, review: true })));
      });
    },

    async listQuestionAnswers(questionId) {
      if (!UUID_PATTERN.test(questionId)) return [];
      return db
        .select({ outcome: answers.outcome, confidence: answers.confidence, answeredAt: answers.answeredAt })
        .from(answers)
        .where(eq(answers.questionId, questionId))
        .orderBy(asc(answers.answeredAt));
    },

    async saveReview(questionId, due, card) {
      await db
        .insert(questionReviews)
        .values({ questionId, due, card })
        .onConflictDoUpdate({ target: questionReviews.questionId, set: { due, card } });
    },

    async listDueReviews(studyId, now, { topicIds, limit } = {}) {
      if (!UUID_PATTERN.test(studyId) || limit === 0) return [];
      const query = db
        .select({ id: questions.id })
        .from(questionReviews)
        .innerJoin(questions, eq(questions.id, questionReviews.questionId))
        .innerJoin(topics, eq(topics.id, questions.topicId))
        .where(
          and(
            eq(questions.studyId, studyId),
            eq(questions.status, "active"),
            eq(topics.status, "active"),
            lte(questionReviews.due, now),
            topicIds ? inArray(questions.topicId, topicIds) : undefined,
          ),
        )
        .orderBy(asc(questionReviews.due), asc(questions.id));
      return (await (limit === undefined ? query : query.limit(limit))).map((row) => row.id);
    },

    async countDueReviews(studyId, now) {
      if (!UUID_PATTERN.test(studyId)) return 0;
      const [{ total }] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(questionReviews)
        .innerJoin(questions, eq(questions.id, questionReviews.questionId))
        .innerJoin(topics, eq(topics.id, questions.topicId))
        .where(
          and(
            eq(questions.studyId, studyId),
            eq(questions.status, "active"),
            eq(topics.status, "active"),
            lte(questionReviews.due, now),
          ),
        );
      return total;
    },
  };
}
