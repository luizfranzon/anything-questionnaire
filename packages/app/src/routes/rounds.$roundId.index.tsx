import { useState } from "react";
import { createFileRoute, notFound, redirect, useNavigate } from "@tanstack/react-router";
import type { Confidence, NextQuestion } from "@anything-questionnaire/engine";
import {
  QuestionScreen,
  type QuestionData,
} from "@anything-questionnaire/ui/screens/Question/QuestionScreen.tsx";
import { answerQuestion, getNextQuestion, getRound, setAnswerConfidence } from "../server/rounds";

export const Route = createFileRoute("/rounds/$roundId/")({
  loader: async ({ params }) => {
    const round = await getRound({ data: params.roundId });
    if (!round.ok) throw notFound();
    const { phase, studyId } = round.data;
    if (phase === "completed") throw redirect({ to: "/rounds/$roundId/result", params });
    if (phase !== "ready" && phase !== "in-progress") {
      throw redirect({ to: "/studies/$studyId/rounds/new", params: { studyId }, search: { round: params.roundId } });
    }
    const next = await getNextQuestion({ data: params.roundId });
    if (!next.ok) throw notFound();
    if (!next.data) throw redirect({ to: "/rounds/$roundId/result", params });
    return { studyId, mode: round.data.mode, next: next.data };
  },
  component: PlayRoundRoute,
});

/** Until the Answer is recorded the Gabarito stays on the server; the correction fills these in. */
const toQuestionData = ({ question }: NextQuestion): QuestionData => ({
  topic: question.topic,
  prompt: question.prompt,
  alternatives: question.alternatives,
  correctId: "",
  explanations: {},
});

const CONFIDENCE: Record<"certeza" | "duvida", Confidence> = { certeza: "sure", duvida: "doubt" };

function PlayRoundRoute() {
  const { roundId } = Route.useParams();
  const { mode, next: first, studyId } = Route.useLoaderData();
  const navigate = useNavigate();
  const [next, setNext] = useState<NextQuestion>(first);
  const [question, setQuestion] = useState<QuestionData>(() => toQuestionData(first));
  const [status, setStatus] = useState<"ready" | "loading" | "error">("ready");

  const leave = () => void navigate({ to: "/studies/$studyId", params: { studyId } });

  return (
    <QuestionScreen
      mode={mode === "mock" ? "mock" : "study"}
      round={{ current: first.position, total: first.total }}
      question={question}
      status={status}
      onExit={leave}
      onAnswer={async (pickedId, confidence) => {
        const result = await answerQuestion({
          data: {
            roundId,
            questionId: next.question.id,
            choice: pickedId,
            confidence: confidence && CONFIDENCE[confidence],
          },
        });
        if (!result.ok) throw new Error(result.code);
        // Mock mode gets nothing back: the correction waits for the end of the Round.
        if (!result.data) return;
        const correction = result.data;
        setQuestion((q) => ({
          ...q,
          correctId: correction.correctAlternativeId,
          explanations: correction.explanations,
        }));
      }}
      onConfidence={(value) => {
        void setAnswerConfidence({
          data: { roundId, questionId: next.question.id, confidence: CONFIDENCE[value] },
        });
      }}
      onNext={async () => {
        setStatus("loading");
        try {
          const result = await getNextQuestion({ data: roundId });
          if (!result.ok) throw new Error(result.code);
          if (!result.data) {
            await navigate({ to: "/rounds/$roundId/result", params: { roundId } });
            return;
          }
          setNext(result.data);
          setQuestion(toQuestionData(result.data));
          setStatus("ready");
        } catch {
          setStatus("error");
        }
      }}
    />
  );
}
