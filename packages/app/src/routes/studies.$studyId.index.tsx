import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { StudyPageScreen } from "@anything-questionnaire/ui/screens/StudyPage/StudyPageScreen.tsx";
import { formatRoundDate } from "../presentation/review-items";
import { listRoundHistory } from "../server/rounds";
import { getStudy } from "../server/studies";
import { countDueReviews, listTopicPerformance } from "../server/topics";

export const Route = createFileRoute("/studies/$studyId/")({
  loader: async ({ params }) => {
    const study = await getStudy({ data: params.studyId });
    if (!study) throw notFound();
    return {
      study,
      topics: await listTopicPerformance({ data: params.studyId }),
      dueReviews: await countDueReviews({ data: params.studyId }),
      history: await listRoundHistory({ data: params.studyId }),
    };
  },
  notFoundComponent: () => <StudyPageScreen status="error" />,
  component: StudyRoute,
});

function StudyRoute() {
  const { study, topics, dueReviews, history } = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <StudyPageScreen
      data={{
        id: study.id,
        name: study.name,
        goal: study.goal,
        topics,
        dueReviews,
        rounds: history.ok
          ? history.data.map((r) => ({
              id: r.id,
              date: formatRoundDate(r.date),
              mode: r.mode,
              answered: r.answered,
              // A mock Round still in progress keeps its hits secret.
              correct: r.correct ?? 0,
              resultHidden: r.correct === null,
              total: r.total,
            }))
          : [],
        // Questions and Sources arrive with their own tickets.
        questions: [],
        sources: [],
      }}
      onNewRound={() => void navigate({ to: "/studies/$studyId/rounds/new", params: { studyId: study.id } })}
      onBack={() => void navigate({ to: "/studies" })}
    />
  );
}
