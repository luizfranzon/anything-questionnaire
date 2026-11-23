import {
  resolveSettings,
  validateModelPrice,
  validateStageModel,
  type ModelPrice,
  type Settings,
} from "../../domain/settings";
import type { Stage } from "../../domain/usage";
import type { SettingsRepository } from "../ports/settings-repository";

export function createSettingsUseCases(settings: SettingsRepository) {
  async function getSettings(): Promise<Settings> {
    return resolveSettings(await settings.stageModelOverrides(), await settings.priceOverrides());
  }

  return {
    getSettings,

    async setStageModel(stage: Stage, model: string): Promise<Settings> {
      validateStageModel(stage, model);
      await settings.setStageModel(stage, model);
      return getSettings();
    },

    async setModelPrice(model: string, price: ModelPrice): Promise<Settings> {
      validateModelPrice(model, price);
      await settings.setPrice(model, price);
      return getSettings();
    },

    /** The model the next call of this Stage must use. Used by the other use cases, not exposed by the engine. */
    async modelFor(stage: Stage): Promise<string> {
      return (await getSettings()).stageModels[stage];
    },
  };
}

export type SettingsUseCases = ReturnType<typeof createSettingsUseCases>;
