import { createServerFn } from "@tanstack/react-start";
import {
  DomainError,
  type DomainErrorCode,
  type Engine,
  type ModelPrice,
  type Settings,
  type Stage,
} from "@anything-questionnaire/engine";
import { getEngine } from "./engine";

export type Result<T> = { ok: true; data: T } | { ok: false; code: DomainErrorCode };

async function toResult<T>(run: (engine: Engine) => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await run(await getEngine()) };
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, code: error.code };
    throw error;
  }
}

export const getSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<Settings> => (await getEngine()).getSettings(),
);

export const setStageModel = createServerFn({ method: "POST" })
  .validator((input: { stage: Stage; model: string }) => input)
  .handler(({ data }) => toResult((engine) => engine.setStageModel(data.stage, data.model)));

export const setModelPrice = createServerFn({ method: "POST" })
  .validator((input: { model: string; price: ModelPrice }) => input)
  .handler(({ data }) => toResult((engine) => engine.setModelPrice(data.model, data.price)));
