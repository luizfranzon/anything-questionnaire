import { createServerFn } from "@tanstack/react-start";
import {
  DomainError,
  type Confidence,
  type Correction,
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
  count: number;
  phase: Round["phase"];
  generated: number;
  answered: number;
}

export interface RoundTopicDto {
  id: string;
  name: string;
}

const toDto = ({ id, studyId, count, phase, generated, answered }: Round): RoundDto => ({
  id,
  studyId,
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
  .validator((input: { studyId: string; count: number; topicIds: string[] }) => input)
  .handler(({ data }) =>
    toResult(() =>
      withEngine(async (engine) =>
        toDto(await engine.createRound(data.studyId, { count: data.count, topicIds: data.topicIds })),
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
  .validator((input: { roundId: string; questionId: string; choice: string | null }) => input)
  .handler(({ data }): Promise<Result<Correction>> =>
    toResult(() => withEngine((engine) => engine.answerQuestion(data.roundId, data.questionId, { choice: data.choice }))),
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

export const getRoundResult = createServerFn({ method: "GET" })
  .validator((roundId: string) => roundId)
  .handler(({ data: roundId }): Promise<Result<RoundResult>> =>
    toResult(() => withEngine((engine) => engine.getRoundResult(roundId))),
  );
