import { useEffect, useState } from "react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { RoundCreateScreen } from "@anything-questionnaire/ui/screens/RoundCreate/RoundCreateScreen.tsx";
import { GENERIC_SAVE_ERROR, messageFor } from "../presentation/error-messages";
import { createRound, getRound, listRoundTopics, type RoundDto } from "../server/rounds";
import { getStudy } from "../server/studies";

const POLL_MS = 2000;

export const Route = createFileRoute("/studies/$studyId/rounds/new")({
  // `round` keeps the progress screen alive across reloads: the generation runs on the server.
  validateSearch: (search: Record<string, unknown>): { round?: string } =>
    typeof search.round === "string" ? { round: search.round } : {},
  loader: async ({ params }) => {
    const study = await getStudy({ data: params.studyId });
    if (!study) throw notFound();
    return { study, topics: await listRoundTopics({ data: params.studyId }) };
  },
  component: NewRoundRoute,
});

function NewRoundRoute() {
  const { study, topics } = Route.useLoaderData();
  const { round: roundId } = Route.useSearch();
  const navigate = useNavigate();
  const [round, setRound] = useState<RoundDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  useEffect(() => {
    if (!roundId) {
      setRound(null);
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      const result = await getRound({ data: roundId });
      if (!cancelled && result.ok) setRound(result.data);
      return result.ok ? result.data.phase : "failed";
    };
    void refresh();
    const timer = setInterval(async () => {
      const phase = await refresh();
      if (phase !== "generating" && phase !== "retrying") clearInterval(timer);
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [roundId]);

  const phase = !roundId
    ? "form"
    : !round
      ? "generating"
      : round.phase === "generating" || round.phase === "retrying" || round.phase === "failed"
        ? round.phase
        : "ready";

  return (
    <RoundCreateScreen
      key={phase}
      studyName={study.name}
      topics={topics}
      phase={phase}
      generated={round ? { done: round.generated, total: round.count } : undefined}
      submitting={submitting}
      submitError={submitError}
      onBack={() => void navigate({ to: "/studies" })}
      onSubmit={async ({ count, mode, topicIds }) => {
        if (mode !== "study") {
          setSubmitError("O modo Simulado ainda não está disponível. Escolha o modo Estudo.");
          return;
        }
        setSubmitting(true);
        setSubmitError(undefined);
        try {
          const result = await createRound({ data: { studyId: study.id, count, topicIds: topicIds.length === topics.length ? [] : topicIds } });
          if (!result.ok) {
            setSubmitError(messageFor(result.code));
            return;
          }
          await navigate({ to: "/studies/$studyId/rounds/new", params: { studyId: study.id }, search: { round: result.data.id } });
        } catch {
          setSubmitError(GENERIC_SAVE_ERROR);
        } finally {
          setSubmitting(false);
        }
      }}
      onRetry={() => void navigate({ to: "/studies/$studyId/rounds/new", params: { studyId: study.id }, search: {} })}
      onStart={() => roundId && void navigate({ to: "/rounds/$roundId", params: { roundId } })}
    />
  );
}
