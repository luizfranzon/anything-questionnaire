import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { SettingsRepository } from "../../application/ports/settings-repository";
import type { Stage } from "../../domain/usage";
import { modelPrices, stageModels } from "./schema";

export function createDrizzleSettingsRepository(db: PostgresJsDatabase): SettingsRepository {
  return {
    async stageModelOverrides() {
      const rows = await db.select().from(stageModels);
      return Object.fromEntries(rows.map((row) => [row.stage as Stage, row.model]));
    },

    async setStageModel(stage, model) {
      await db
        .insert(stageModels)
        .values({ stage, model })
        .onConflictDoUpdate({ target: stageModels.stage, set: { model } });
    },

    async setPrice(model, price) {
      await db.insert(modelPrices).values({ model, ...price }).onConflictDoUpdate({ target: modelPrices.model, set: price });
    },

    async priceOverrides() {
      const rows = await db.select().from(modelPrices);
      return Object.fromEntries(
        rows.map(({ model, ...price }) => [model, price]),
      );
    },
  };
}
