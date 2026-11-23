import { buildUsageMetrics, type UsageMetrics } from "../../domain/metrics";
import type { Settings } from "../../domain/settings";
import type { UsageFilter, UsageRepository } from "../ports/topic-proposal-ports";

export function createMetricsUseCases(usage: UsageRepository, getSettings: () => Promise<Settings>) {
  return {
    /** Tokens and estimated cost of the Claude calls, priced from the price table in force at query time. */
    async getUsageMetrics(filter: UsageFilter = {}): Promise<UsageMetrics> {
      const [records, settings] = await Promise.all([usage.find(filter), getSettings()]);
      return buildUsageMetrics(records, settings.prices);
    },
  };
}
