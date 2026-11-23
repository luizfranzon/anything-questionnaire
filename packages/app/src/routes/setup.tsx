import { useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { SetupScreen } from "@anything-questionnaire/ui/screens/Setup/SetupScreen.tsx";
import { GENERIC_SAVE_ERROR, messageFor } from "../presentation/error-messages";
import { getCredentialStatus, saveCredential } from "../server/credentials";

export const Route = createFileRoute("/setup")({
  loader: () => getCredentialStatus(),
  component: SetupRoute,
});

function SetupRoute() {
  const status = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <SetupScreen
      mode={status.configured ? "settings" : "first-run"}
      current={status.configured ? status : undefined}
      validating={validating}
      error={error}
      onExit={() => navigate({ to: "/settings" })}
      onSubmit={async (input) => {
        setValidating(true);
        setError(undefined);
        try {
          const result = await saveCredential({ data: input });
          if (!result.ok) {
            setError(messageFor(result.code));
            return;
          }
          // The guard in the root route re-reads the status, so the app opens now.
          await router.invalidate();
          await navigate({ to: "/studies" });
        } catch {
          setError(GENERIC_SAVE_ERROR);
        } finally {
          setValidating(false);
        }
      }}
    />
  );
}
