import { useState } from "react";
import { createFileRoute, notFound, redirect, useNavigate } from "@tanstack/react-router";
import { ReviewList } from "@anything-questionnaire/ui/components/ReviewList/ReviewList.tsx";
import { RoundResultScreen } from "@anything-questionnaire/ui/screens/RoundResult/RoundResultScreen.tsx";
import { toReviewItem } from "../presentation/review-items";
import { getRound, getRoundCorrection, getRoundResult } from "../server/rounds";
import { getStudy } from "../server/studies";

export const Route = createFileRoute("/rounds/$roundId/result")({
  loader: async ({ params }) => {
    const round = await getRound({ data: params.roundId });
    if (!round.ok) throw notFound();
    if (round.data.phase !== "completed") throw redirect({ to: "/rounds/$roundId", params });
    const [result, correction, study] = await Promise.all([
      getRoundResult({ data: params.roundId }),
      getRoundCorrection({ data: params.roundId }),
      getStudy({ data: round.data.studyId }),
    ]);
    if (!result.ok || !correction.ok || !study) throw notFound();
    return { result: result.data, correction: correction.data, mode: round.data.mode, study };
  },
  component: RoundResultRoute,
});

function RoundResultRoute() {
  const { result, correction, mode, study } = Route.useLoaderData();
  const navigate = useNavigate();
  const [showCorrection, setShowCorrection] = useState(false);
  return (
    <RoundResultScreen
      studyName={study.name}
      correct={result.correct}
      total={result.total}
      dontKnow={result.dontKnow}
      mode={mode}
      canReview={correction.length > 0 && !showCorrection}
      onReview={() => setShowCorrection(true)}
      onBack={() => void navigate({ to: "/studies/$studyId", params: { studyId: study.id } })}
      onNewRound={() => void navigate({ to: "/studies/$studyId/rounds/new", params: { studyId: study.id }, search: {} })}
    >
      {showCorrection && <ReviewList items={correction.map(toReviewItem)} roundTotal={result.total} />}
    </RoundResultScreen>
  );
}
