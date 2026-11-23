import { createServerFn } from "@tanstack/react-start";
import type { Stage, UsageMetrics } from "@anything-questionnaire/engine";
import { getEngine } from "./engine";

export interface UsageMetricsQuery {
  /** Instants as ISO strings, since server function inputs cross the wire as JSON. Both ends are inclusive. */
  from?: string;
  to?: string;
  studyId?: string;
  stage?: Stage;
}

export const getUsageMetrics = createServerFn({ method: "GET" })
  .validator((input: UsageMetricsQuery) => input)
  .handler(
    async ({ data }): Promise<UsageMetrics> =>
      (await getEngine()).getUsageMetrics({
        studyId: data.studyId,
        stage: data.stage,
        from: data.from ? new Date(data.from) : undefined,
        to: data.to ? new Date(data.to) : undefined,
      }),
  );
