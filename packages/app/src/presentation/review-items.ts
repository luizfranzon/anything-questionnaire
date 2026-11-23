import type { CorrectionItem } from "@anything-questionnaire/engine";
import type { ReviewItem } from "@anything-questionnaire/ui/components/ReviewList/ReviewList.tsx";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** The engine's correction of one Question, in the shape the review list draws. */
export const toReviewItem = (item: CorrectionItem): ReviewItem => ({
  id: item.question.id,
  position: item.position,
  topic: item.question.topic,
  prompt: item.question.prompt,
  alternatives: item.question.alternatives,
  pickedId: item.pickedId,
  correctId: item.correctAlternativeId,
  confidence: item.confidence ? (item.confidence === "sure" ? "certeza" : "duvida") : undefined,
  // The right one first, then the others, each lettered by the position it had on screen.
  explanations: item.question.alternatives
    .map((alt, i) => ({
      letter: LETTERS[i],
      correct: alt.id === item.correctAlternativeId,
      picked: alt.id === item.pickedId,
      why: item.explanations[alt.id],
    }))
    .sort((a, b) => Number(b.correct) - Number(a.correct)),
});

/** "22/11". Fixed zone so the server render and the browser agree. */
export const formatRoundDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
