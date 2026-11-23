import { createFileRoute, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { metricsPresets } from "@anything-questionnaire/ui/components/DateRange/DateRangePicker.tsx";
import type {
  MetricsFilterValue,
  MetricsPeriod,
} from "@anything-questionnaire/ui/components/Metrics/FilterBar.tsx";
import { MetricsScreen } from "@anything-questionnaire/ui/screens/Metrics/MetricsScreen.tsx";
import { toMetricsData } from "../presentation/metrics";
import { STAGE_BY_SCREEN_ID } from "../presentation/stages";
import { getUsageMetrics } from "../server/metrics";
import { listStudies } from "../server/studies";

interface MetricsSearch {
  period: MetricsPeriod;
  from?: string;
  to?: string;
  study: string;
  stage: string;
}

const PERIODS: MetricsPeriod[] = ["today", "7d", "30d", "90d", "custom"];
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The filters live in the URL, so a filtered view can be reloaded and shared. */
function validateSearch(search: Record<string, unknown>): MetricsSearch {
  const text = (value: unknown) => (typeof value === "string" && value ? value : undefined);
  const day = (value: unknown) => (typeof value === "string" && DAY.test(value) ? value : undefined);
  const period = PERIODS.find((p) => p === search.period) ?? "30d";
  return {
    period,
    from: day(search.from),
    to: day(search.to),
    study: text(search.study) ?? "all",
    stage: text(search.stage) ?? "all",
  };
}

/** The period to query: the dates given, or the ones the shortcut stands for today. */
function resolveFilters(search: MetricsSearch, today: string): MetricsFilterValue & { from: string; to: string } {
  const shortcut = metricsPresets.find((p) => p.id === search.period)?.range(today) ?? { from: today, to: today };
  return {
    period: search.period,
    from: search.period === "custom" && search.from ? search.from : shortcut.from,
    to: search.period === "custom" && search.to ? search.to : shortcut.to,
    study: search.study,
    stage: search.stage,
  };
}

/** Today as the engine sees it: it buckets calls by UTC day, so "today" and the period ends are UTC days too. */
const todayUTC = () => new Date().toISOString().slice(0, 10);

export const Route = createFileRoute("/metrics")({
  validateSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const today = todayUTC();
    const filters = resolveFilters(deps, today);
    const [metrics, studies] = await Promise.all([
      getUsageMetrics({
        data: {
          // The engine buckets days in UTC, so the period is read the same way.
          from: `${filters.from}T00:00:00.000Z`,
          to: `${filters.to}T23:59:59.999Z`,
          studyId: filters.study === "all" ? undefined : filters.study,
          stage: STAGE_BY_SCREEN_ID[filters.stage],
        },
      }),
      listStudies(),
    ]);
    return { today, filters, studies, data: toMetricsData(metrics, filters) };
  },
  component: MetricsRoute,
});

function MetricsRoute() {
  const { today, filters, studies, data } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const loading = useRouterState({ select: (state) => state.isLoading });

  return (
    <MetricsScreen
      status={loading ? "refetching" : "ready"}
      data={data}
      initialFilters={filters}
      studies={studies.map((s) => ({ value: s.id, label: s.name }))}
      today={today}
      onFiltersChange={(next) =>
        navigate({
          to: "/metrics",
          search: { period: next.period, from: next.from || undefined, to: next.to || undefined, study: next.study, stage: next.stage },
        })
      }
      onRetry={() => router.invalidate()}
    />
  );
}
