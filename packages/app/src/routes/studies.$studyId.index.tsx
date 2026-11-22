import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { StudyPageScreen } from "@anything-questionnaire/ui/screens/StudyPage/StudyPageScreen.tsx";
import { getStudy } from "../server/studies";
import { listTopicPerformance } from "../server/topics";

export const Route = createFileRoute("/studies/$studyId/")({
  loader: async ({ params }) => {
    const study = await getStudy({ data: params.studyId });
    if (!study) throw notFound();
    return { study, topics: await listTopicPerformance({ data: params.studyId }) };
  },
  notFoundComponent: () => <StudyPageScreen status="error" />,
  component: StudyRoute,
});

function StudyRoute() {
  const { study, topics } = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <StudyPageScreen
      data={{
        id: study.id,
        name: study.name,
        goal: study.goal,
        topics,
        dueReviews: 0,
        // Rounds, Questions and Sources arrive with their own tickets.
        rounds: [],
        questions: [],
        sources: [],
      }}
      onNewRound={() => void navigate({ to: "/studies/$studyId/rounds/new", params: { studyId: study.id } })}
    />
  );
}
