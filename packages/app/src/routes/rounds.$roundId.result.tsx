import { createFileRoute, notFound, redirect, useNavigate } from "@tanstack/react-router";
import { RoundResultScreen } from "@anything-questionnaire/ui/screens/RoundResult/RoundResultScreen.tsx";
import { getRound, getRoundResult } from "../server/rounds";
import { getStudy } from "../server/studies";

export const Route = createFileRoute("/rounds/$roundId/result")({
  loader: async ({ params }) => {
    const round = await getRound({ data: params.roundId });
    if (!round.ok) throw notFound();
    if (round.data.phase !== "completed") throw redirect({ to: "/rounds/$roundId", params });
    const [result, study] = await Promise.all([
      getRoundResult({ data: params.roundId }),
      getStudy({ data: round.data.studyId }),
    ]);
    if (!result.ok || !study) throw notFound();
    return { result: result.data, study };
  },
  component: RoundResultRoute,
});

function RoundResultRoute() {
  const { result, study } = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <RoundResultScreen
      studyName={study.name}
      correct={result.correct}
      total={result.total}
      dontKnow={result.dontKnow}
      mode="study"
      canReview={false}
      onBack={() => void navigate({ to: "/studies" })}
      onNewRound={() => void navigate({ to: "/studies/$studyId/rounds/new", params: { studyId: study.id }, search: {} })}
    />
  );
}
