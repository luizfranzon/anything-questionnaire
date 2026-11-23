import { DomainError } from "./errors";
import { DEFAULT_MODEL, type Stage } from "./usage";

export const STAGES: readonly Stage[] = [
  "topic-extraction",
  "excerpt-classification",
  "question-generation",
  "blind-resolution",
  "contestation-judgment",
];

/** US$ per 1 million tokens. */
export interface ModelPrice {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

/** Models the user can pick for a Stage, with the starting price of each. The user edits the prices. */
export const OFFERED_MODELS: Readonly<Record<string, ModelPrice>> = {
  "claude-fable-5-2": { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  "claude-opus-5-5": { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  "claude-sonnet-5-5": { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  "claude-haiku-5-5": { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
};

export function validateStageModel(stage: Stage, model: string): void {
  if (!STAGES.includes(stage)) throw new DomainError("STAGE_NOT_FOUND");
  if (!(model in OFFERED_MODELS)) throw new DomainError("MODEL_NOT_OFFERED");
}

export function validateModelPrice(model: string, price: ModelPrice): void {
  if (!(model in OFFERED_MODELS)) throw new DomainError("MODEL_NOT_OFFERED");
  for (const value of [price.input, price.output, price.cacheRead, price.cacheWrite]) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new DomainError("PRICE_INVALID");
  }
}

/** The offered model with the lowest input price, for calls that only need to prove access. */
export function cheapestModel(prices: Record<string, ModelPrice>): string {
  return Object.entries(prices).reduce((best, entry) => (entry[1].input < best[1].input ? entry : best))[0];
}

export interface Settings {
  stageModels: Record<Stage, string>;
  offeredModels: string[];
  prices: Record<string, ModelPrice>;
}

/** Combines what the user changed with the defaults. */
export function resolveSettings(
  stageOverrides: Partial<Record<Stage, string>>,
  priceOverrides: Record<string, ModelPrice>,
): Settings {
  const offeredModels = Object.keys(OFFERED_MODELS);
  return {
    stageModels: Object.fromEntries(
      STAGES.map((stage) => [stage, stageOverrides[stage] ?? DEFAULT_MODEL]),
    ) as Record<Stage, string>,
    offeredModels,
    prices: Object.fromEntries(
      offeredModels.map((model) => [model, priceOverrides[model] ?? OFFERED_MODELS[model]]),
    ),
  };
}
