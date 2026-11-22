import { createServerFn } from "@tanstack/react-start";
import {
  DomainError,
  type DomainErrorCode,
  type Engine,
  type ProposalPhase,
  type TopicProposal,
} from "@anything-questionnaire/engine";
import { getEngine } from "./engine";

export interface ProposalDto {
  phase: ProposalPhase;
  topics: string[];
}

export type Result<T> = { ok: true; data: T } | { ok: false; code: DomainErrorCode };

const toDto = ({ phase, topics }: TopicProposal): ProposalDto => ({ phase, topics });

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

/** The proposal lives on the server, so this keeps working after closing and reopening the tab. */
export const getTopicProposal = createServerFn({ method: "GET" })
  .validator((studyId: string) => studyId)
  .handler(({ data: studyId }): Promise<ProposalDto | null> =>
    withEngine(async (engine) => {
      const proposal = await engine.getTopicProposal(studyId);
      return proposal ? toDto(proposal) : null;
    }),
  );

export const requestTopicProposal = createServerFn({ method: "POST" })
  .validator((studyId: string) => studyId)
  .handler(({ data: studyId }) =>
    toResult(() => withEngine(async (engine) => toDto(await engine.requestTopicProposal(studyId)))),
  );

export const approveTopicProposal = createServerFn({ method: "POST" })
  .validator((input: { studyId: string; names: string[] }) => input)
  .handler(({ data }) =>
    toResult(() =>
      withEngine(async (engine) => {
        await engine.approveTopicProposal(data.studyId, data.names);
      }),
    ),
  );

export const countTopics = createServerFn({ method: "GET" })
  .validator((studyId: string) => studyId)
  .handler(({ data: studyId }): Promise<number> =>
    withEngine(async (engine) => (await engine.listTopics(studyId)).length),
  );

export interface TopicPerformanceDto {
  id: string;
  name: string;
  /** 0 to 100, or null when the Topic was never asked. */
  performance: number | null;
  trend: "up" | "down" | "flat" | "unknown";
  delta?: number;
  answers: number;
}

/** The active Topics of a Study, never-asked first and then from the weakest to the strongest. */
export const listTopicPerformance = createServerFn({ method: "GET" })
  .validator((studyId: string) => studyId)
  .handler(
    ({ data: studyId }): Promise<TopicPerformanceDto[]> =>
      withEngine(async (engine) =>
        (await engine.listTopicPerformance(studyId)).map((t) => ({
          id: t.topicId,
          name: t.name,
          performance: t.performance === null ? null : Math.round(t.performance * 100),
          trend: t.trend === null ? "unknown" : t.trend === "steady" ? "flat" : t.trend,
          delta: t.delta ?? undefined,
          answers: t.answers,
        })),
      ),
  );

/** Revisões (answered Questions whose spaced repetition is due) waiting in the Study right now. */
export const countDueReviews = createServerFn({ method: "GET" })
  .validator((studyId: string) => studyId)
  .handler(({ data: studyId }): Promise<number> => withEngine((engine) => engine.countDueReviews(studyId)));
