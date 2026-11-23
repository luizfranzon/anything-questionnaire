import { createServerFn } from "@tanstack/react-start";
import {
  DomainError,
  type Confidence,
  type Correction,
  type CorrectionItem,
  type DomainErrorCode,
  type Engine,
  type NextQuestion,
  type Round,
  type RoundResult,
} from "@anything-questionnaire/engine";
import { getEngine } from "./engine";

export type Result<T> = { ok: true; data: T } | { ok: false; code: DomainErrorCode };

export interface RoundDto {
  id: string;
  studyId: string;
  mode: Round["mode"];
  count: number;
  phase: Round["phase"];
  generated: number;
  answered: number;
}

export interface RoundTopicDto {
  id: string;
  name: string;
}

const toDto = ({ id, studyId, mode, count, phase, generated, answered }: Round): RoundDto => ({
  id,
  studyId,
  mode,
  count,
  phase,
  generated,
  answered,
});

async function withEngine<T>(run: (engine: Engine) => Promise<T>): Promise<T> {
  return run(await getEngine());
}

async function toResult<T>(run: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, code: error.code };
    throw error;
  }
}

/** The active Topics a new Round can draw from. */
export const listRoundTopics = createServerFn({ method: "GET" })
  .validator((studyId: string) => studyId)
  .handler(
    ({ data: studyId }): Promise<RoundTopicDto[]> =>
      withEngine(async (engine) => (await engine.listTopics(studyId)).map(({ id, name }) => ({ id, name }))),
  );

export const createRound = createServerFn({ method: "POST" })
  .validator((input: { studyId: string; count: number; mode: Round["mode"]; topicIds: string[] }) => input)
  .handler(({ data }) =>
    toResult(() =>
      withEngine(async (engine) =>
        toDto(await engine.createRound(data.studyId, { count: data.count, mode: data.mode, topicIds: data.topicIds })),
      ),
    ),
  );

/** Polled while the Round is being generated; the job runs on the server, so closing the tab loses nothing. */
export const getRound = createServerFn({ method: "GET" })
  .validator((roundId: string) => roundId)
  .handler(({ data: roundId }) => toResult(() => withEngine(async (engine) => toDto(await engine.getRound(roundId)))));

export const getNextQuestion = createServerFn({ method: "GET" })
  .validator((roundId: string) => roundId)
  .handler(({ data: roundId }): Promise<Result<NextQuestion | null>> =>
    toResult(() => withEngine((engine) => engine.getNextQuestion(roundId))),
  );

export const answerQuestion = createServerFn({ method: "POST" })
  .validator((input: { roundId: string; questionId: string; choice: string | null; confidence?: Confidence }) => input)
  .handler(({ data }): Promise<Result<Correction | null>> =>
    toResult(() =>
      withEngine((engine) =>
        engine.answerQuestion(data.roundId, data.questionId, { choice: data.choice, confidence: data.confidence }),
      ),
    ),
  );

export const setAnswerConfidence = createServerFn({ method: "POST" })
  .validator((input: { roundId: string; questionId: string; confidence: Confidence }) => input)
  .handler(({ data }) =>
    toResult(() =>
      withEngine(async (engine) => {
        await engine.setAnswerConfidence(data.roundId, data.questionId, data.confidence);
      }),
    ),
  );

/** The full correction of a finished Round. The engine refuses it before the end, so nothing leaks mid-Round. */
export const getRoundCorrection = createServerFn({ method: "GET" })
  .validator((roundId: string) => roundId)
  .handler(({ data: roundId }): Promise<Result<CorrectionItem[]>> =>
    toResult(() => withEngine((engine) => engine.getRoundCorrection(roundId))),
  );

export interface RoundHistoryDto {
  id: string;
  /** ISO timestamp; the screen formats it in the viewer's time zone. */
  date: string;
  mode: Round["mode"];
  total: number;
  answered: number;
  /** `null` while a mock Round is unfinished. */
  correct: number | null;
}

export interface RoundReviewDto {
  date: string;
  mode: Round["mode"];
  total: number;
  items: CorrectionItem[];
}

/** The Study's Rounds that were played, most recent first. */
export const listRoundHistory = createServerFn({ method: "GET" })
  .validator((studyId: string) => studyId)
  .handler(({ data: studyId }): Promise<Result<RoundHistoryDto[]>> =>
    toResult(() =>
      withEngine(async (engine) =>
        (await engine.listRoundHistory(studyId)).map((r) => ({ ...r, date: r.date.toISOString() })),
      ),
    ),
  );

/** A past Round with what was answered of it. The engine holds a mock Round back until it ends. */
export const getRoundReview = createServerFn({ method: "GET" })
  .validator((roundId: string) => roundId)
  .handler(({ data: roundId }): Promise<Result<RoundReviewDto>> =>
    toResult(() =>
      withEngine(async (engine) => {
        const review = await engine.getRoundReview(roundId);
        return { ...review, date: review.date.toISOString() };
      }),
    ),
  );

export const getRoundResult = createServerFn({ method: "GET" })
  .validator((roundId: string) => roundId)
  .handler(({ data: roundId }): Promise<Result<RoundResult>> =>
    toResult(() => withEngine((engine) => engine.getRoundResult(roundId))),
  );
