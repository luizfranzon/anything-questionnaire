import { useState } from "react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { StudyFormScreen } from "@anything-questionnaire/ui/screens/StudyForm/StudyFormScreen.tsx";
import { GENERIC_SAVE_ERROR, messageFor } from "../presentation/error-messages";
import { getStudy, updateStudy } from "../server/studies";

export const Route = createFileRoute("/studies/$studyId/edit")({
  loader: async ({ params }) => {
    const study = await getStudy({ data: params.studyId });
    if (!study) throw notFound();
    return study;
  },
  notFoundComponent: () => <StudyFormScreen mode="edit" status="error" />,
  component: EditStudyRoute,
});

function EditStudyRoute() {
  const study = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  return (
    <StudyFormScreen
      mode="edit"
      initial={{ name: study.name, goal: study.goal }}
      saving={saving}
      saveError={saveError}
      onCancel={() => navigate({ to: "/studies" })}
      onSubmit={async (values) => {
        setSaving(true);
        setSaveError(undefined);
        try {
          const result = await updateStudy({ data: { id: study.id, ...values } });
          if (!result.ok) {
            setSaveError(messageFor(result.code));
            setSaving(false);
            return;
          }
          await navigate({ to: "/studies" });
        } catch {
          setSaveError(GENERIC_SAVE_ERROR);
          setSaving(false);
        }
      }}
    />
  );
}
