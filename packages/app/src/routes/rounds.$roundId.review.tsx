import { createFileRoute, notFound, redirect, useNavigate } from "@tanstack/react-router";
import { RoundDetailScreen } from "@anything-questionnaire/ui/screens/RoundDetail/RoundDetailScreen.tsx";
import { formatRoundDate, toReviewItem } from "../presentation/review-items";
import { getRound, getRoundReview } from "../server/rounds";
import { getStudy } from "../server/studies";

export const Route = createFileRoute("/rounds/$roundId/review")({
  loader: async ({ params }) => {
    const round = await getRound({ data: params.roundId });
    if (!round.ok) throw notFound();
    const review = await getRoundReview({ data: params.roundId });
    // A Round still generating, or a mock Round not finished: there is nothing to review yet.
    if (!review.ok && (review.code === "ROUND_NOT_READY" || review.code === "ROUND_NOT_COMPLETED")) {
      throw redirect({ to: "/rounds/$roundId", params });
    }
    if (!review.ok) throw notFound();
    const study = await getStudy({ data: round.data.studyId });
    if (!study) throw notFound();
    return { review: review.data, study };
  },
  component: RoundReviewRoute,
});

function RoundReviewRoute() {
  const { review, study } = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <RoundDetailScreen
      studyName={study.name}
      date={formatRoundDate(review.date)}
      mode={review.mode}
      items={review.items.map(toReviewItem)}
      roundTotal={review.total}
      onBack={() => void navigate({ to: "/studies/$studyId", params: { studyId: study.id } })}
    />
  );
}
