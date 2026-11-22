import { createServerFn } from "@tanstack/react-start";
import {
  DomainError,
  type DomainErrorCode,
  type Engine,
  type Study,
  type StudyDetails,
} from "@anything-questionnaire/engine";
import { getEngine } from "./engine";

export interface StudyDto {
  id: string;
  name: string;
  goal: string;
}

export type Result<T> = { ok: true; data: T } | { ok: false; code: DomainErrorCode };

const toDto = ({ id, name, goal }: Study): StudyDto => ({ id, name, goal });

async function withEngine<T>(run: (engine: Engine) => Promise<T>): Promise<T> {
  return run(await getEngine());
}

/** Server functions stay thin: they delegate to the engine and translate domain errors into results. */
async function toResult<T>(run: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, code: error.code };
    throw error;
  }
}

export const listStudies = createServerFn({ method: "GET" }).handler(
  (): Promise<StudyDto[]> => withEngine(async (engine) => (await engine.listStudies()).map(toDto)),
);

export const getStudy = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(({ data: id }): Promise<StudyDto | null> =>
    withEngine(async (engine) => {
      const study = await engine.getStudy(id);
      return study ? toDto(study) : null;
    }),
  );

export const createStudy = createServerFn({ method: "POST" })
  .validator((input: StudyDetails) => input)
  .handler(({ data }) => toResult(() => withEngine(async (engine) => toDto(await engine.createStudy(data)))));

export const updateStudy = createServerFn({ method: "POST" })
  .validator((input: StudyDetails & { id: string }) => input)
  .handler(({ data: { id, ...details } }) =>
    toResult(() => withEngine(async (engine) => toDto(await engine.updateStudy(id, details)))),
  );

export const deleteStudy = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(({ data: id }): Promise<void> => withEngine((engine) => engine.deleteStudy(id)));
