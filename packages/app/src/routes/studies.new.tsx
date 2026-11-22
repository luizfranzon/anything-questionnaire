import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StudyFormScreen } from "@anything-questionnaire/ui/screens/StudyForm/StudyFormScreen.tsx";
import { GENERIC_SAVE_ERROR, messageFor } from "../presentation/error-messages";
import { createStudy } from "../server/studies";

export const Route = createFileRoute("/studies/new")({ component: NewStudyRoute });

function NewStudyRoute() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  return (
    <StudyFormScreen
      mode="create"
      saving={saving}
      saveError={saveError}
      onCancel={() => navigate({ to: "/studies" })}
      onSubmit={async (values) => {
        setSaving(true);
        setSaveError(undefined);
        try {
          const result = await createStudy({ data: values });
          if (!result.ok) {
            setSaveError(messageFor(result.code));
            setSaving(false);
            return;
          }
          await navigate({ to: "/studies/$studyId/topics", params: { studyId: result.data.id } });
        } catch {
          setSaveError(GENERIC_SAVE_ERROR);
          setSaving(false);
        }
      }}
    />
  );
}
