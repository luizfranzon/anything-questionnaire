import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { StudyListScreen } from "@anything-questionnaire/ui/screens/StudyList/StudyListScreen.tsx";
import { deleteStudy, listStudies } from "../server/studies";

export const Route = createFileRoute("/studies/")({
  loader: () => listStudies(),
  component: StudiesRoute,
});

function StudiesRoute() {
  const studies = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  return (
    <StudyListScreen
      studies={studies.map((s) => ({ ...s, topicCount: 0, sourceCount: 0 }))}
      onCreate={() => navigate({ to: "/studies/new" })}
      onEdit={(id) => navigate({ to: "/studies/$studyId/edit", params: { studyId: id } })}
      onDelete={async (id) => {
        await deleteStudy({ data: id });
        await router.invalidate();
      }}
    />
  );
}
