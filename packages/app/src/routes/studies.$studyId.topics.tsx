import { useEffect, useState } from "react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { TopicProposalScreen } from "@anything-questionnaire/ui/screens/TopicProposal/TopicProposalScreen.tsx";
import { GENERIC_SAVE_ERROR, messageFor } from "../presentation/error-messages";
import { getStudy } from "../server/studies";
import {
  approveTopicProposal,
  countTopics,
  getTopicProposal,
  requestTopicProposal,
  type ProposalDto,
} from "../server/topics";

const POLL_MS = 2000;

export const Route = createFileRoute("/studies/$studyId/topics")({
  loader: async ({ params }) => {
    const study = await getStudy({ data: params.studyId });
    if (!study) throw notFound();
    const [proposal, topicCount] = await Promise.all([
      getTopicProposal({ data: params.studyId }),
      countTopics({ data: params.studyId }),
    ]);
    return { study, proposal, topicCount };
  },
  component: TopicsRoute,
});

function TopicsRoute() {
  const { study, proposal: initial, topicCount } = Route.useLoaderData();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<ProposalDto | null>(initial);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  async function request() {
    const result = await requestTopicProposal({ data: study.id });
    if (result.ok) setProposal(result.data);
  }

  // A Study with no Topics and no proposal yet: ask Claude right away.
  useEffect(() => {
    if (!initial && topicCount === 0) void request();
    else if (!initial) void navigate({ to: "/studies/$studyId", params: { studyId: study.id } });
  }, []);

  // The job runs on the server: poll its status while it is in flight.
  const phase = proposal?.phase;
  useEffect(() => {
    if (phase !== "generating" && phase !== "retrying") return;
    const timer = setInterval(async () => {
      const latest = await getTopicProposal({ data: study.id });
      if (latest) setProposal(latest);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [phase, study.id]);

  return (
    <TopicProposalScreen
      key={phase}
      studyName={study.name}
      phase={phase ?? "generating"}
      topics={(proposal?.topics ?? []).map((name, i) => ({ id: `p${i}`, name }))}
      saving={saving}
      saveError={saveError}
      onRetry={() => void request()}
      onBack={() => void navigate({ to: "/studies/$studyId", params: { studyId: study.id } })}
      onApprove={async (topics) => {
        setSaving(true);
        setSaveError(undefined);
        try {
          const result = await approveTopicProposal({ data: { studyId: study.id, names: topics.map((t) => t.name) } });
          if (!result.ok) {
            setSaveError(messageFor(result.code));
            setSaving(false);
            return;
          }
          await navigate({ to: "/studies/$studyId", params: { studyId: study.id } });
        } catch {
          setSaveError(GENERIC_SAVE_ERROR);
          setSaving(false);
        }
      }}
    />
  );
}
