import type { ModelPrice } from "../../domain/settings";
import type { Stage } from "../../domain/usage";

/** Stores only what the user changed; the defaults live in the domain. */
export interface SettingsRepository {
  stageModelOverrides(): Promise<Partial<Record<Stage, string>>>;
  setStageModel(stage: Stage, model: string): Promise<void>;
  priceOverrides(): Promise<Record<string, ModelPrice>>;
  setPrice(model: string, price: ModelPrice): Promise<void>;
}
