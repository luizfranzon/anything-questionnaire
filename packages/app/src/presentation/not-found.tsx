import { useNavigate } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { AppShell } from "@anything-questionnaire/ui/components/AppShell/AppShell.tsx";
import { Button } from "@anything-questionnaire/ui/components/Button/Button.tsx";
import { EmptyState } from "@anything-questionnaire/ui/components/EmptyState/EmptyState.tsx";

/** Shown for unknown URLs and whenever a loader throws `notFound()` (a Study or Round that no longer exists). */
export function NotFound() {
  const navigate = useNavigate();
  return (
    <AppShell current="studies" width="reading">
      <EmptyState
        icon={<SearchX size={28} />}
        title="Página não encontrada"
        action={<Button onClick={() => void navigate({ to: "/studies" })}>Ir para os Estudos</Button>}
      >
        O endereço não existe ou o que você procurava foi removido.
      </EmptyState>
    </AppShell>
  );
}
