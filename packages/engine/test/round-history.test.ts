import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestEngine } from "./helpers";

let ctx: Awaited<ReturnType<typeof createTestEngine>>;
beforeEach(async () => {
  ctx = await createTestEngine();
});
afterEach(async () => {
  await ctx.cleanup();
});

const correctOf = (alternatives: Array<{ id: string; text: string }>) =>
  alternatives.find((a) => a.text.endsWith("opção A"))!.id;
const wrongOf = (alternatives: Array<{ id: string; text: string }>) =>
  alternatives.find((a) => !a.text.endsWith("opção A"))!.id;

async function study() {
  const created = await ctx.engine.createStudy({ name: "AWS SAA", goal: "Pass the SAA-C03 exam" });
  ctx.claude.whenExtractingTopics({ topics: ["IAM", "VPC"] });
  await ctx.engine.requestTopicProposal(created.id);
  await ctx.engine.drainJobs();
  await ctx.engine.approveTopicProposal(created.id, ["IAM", "VPC"]);
  return created;
}

/** Creates a ready Round and answers `pattern.length` Questions: true is right, false wrong, null "Não sei". */
async function playRound(
  studyId: string,
  count: number,
  pattern: Array<boolean | null>,
  mode: "study" | "mock" = "study",
) {
  const round = await ctx.engine.createRound(studyId, { count, mode });
  await ctx.engine.drainJobs();
  for (const result of pattern) {
    const { question } = (await ctx.engine.getNextQuestion(round.id))!;
    const choice =
      result === null ? null : result ? correctOf(question.alternatives) : wrongOf(question.alternatives);
    await ctx.engine.answerQuestion(round.id, question.id, { choice, confidence: "sure" });
  }
  return round;
}

describe("Round history", () => {
  it("lists the Rounds of the Study from the most recent to the oldest, with date, Modo and hits", async () => {
    const { id } = await study();
    ctx.clock.set(new Date("2026-02-01T10:00:00Z"));
    const first = await playRound(id, 2, [true, false]);
    ctx.clock.set(new Date("2026-03-05T10:00:00Z"));
    const second = await playRound(id, 3, [true, true, true], "mock");

    const history = await ctx.engine.listRoundHistory(id);

    expect(history.map((r) => r.id)).toEqual([second.id, first.id]);
    expect(history[0]).toMatchObject({ mode: "mock", answered: 3, total: 3, correct: 3 });
    expect(history[1]).toMatchObject({ mode: "study", answered: 2, total: 2, correct: 1 });
    expect(history[0].date.toISOString().slice(0, 10)).toBe("2026-03-05");
  });

  it("counts \"Não sei\" as a miss and leaves out Rounds that were never started or are still generating", async () => {
    const { id } = await study();
    await playRound(id, 2, [true, null]);
    await ctx.engine.createRound(id, { count: 2 });
    await ctx.engine.drainJobs();
    await ctx.engine.createRound(id, { count: 2 });

    const history = await ctx.engine.listRoundHistory(id);

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ correct: 1, answered: 2 });
  });

  it("shows a Round left halfway with only what was answered", async () => {
    const { id } = await study();
    const round = await playRound(id, 4, [true, false]);

    const [entry] = await ctx.engine.listRoundHistory(id);
    expect(entry).toMatchObject({ id: round.id, answered: 2, total: 4, correct: 1 });

    const detail = await ctx.engine.getRoundReview(round.id);
    expect(detail.items.map((i) => i.position)).toEqual([1, 2]);
  });

  it("holds back the hits of a mock Round until it ends", async () => {
    const { id } = await study();
    const round = await playRound(id, 3, [true, true], "mock");

    const [entry] = await ctx.engine.listRoundHistory(id);
    expect(entry).toMatchObject({ id: round.id, mode: "mock", answered: 2, correct: null });
    await expect(ctx.engine.getRoundReview(round.id)).rejects.toMatchObject({ code: "ROUND_NOT_COMPLETED" });
  });

  it("shows each Question in presented order with the pick, Confiança, result, Gabarito and Explicação", async () => {
    const { id } = await study();
    const round = await playRound(id, 3, [true, false, null]);

    const { items, mode, total, date } = await ctx.engine.getRoundReview(round.id);

    expect(mode).toBe("study");
    expect(total).toBe(3);
    expect(date).toBeInstanceOf(Date);
    expect(items.map((i) => i.position)).toEqual([1, 2, 3]);
    expect(items.map((i) => i.outcome)).toEqual(["correct", "incorrect", "incorrect"]);
    expect(items[2].pickedId).toBeNull();
    expect(items[1].pickedId).not.toBe(items[1].correctAlternativeId);
    // Study mode keeps Confiança only for correct Answers.
    expect(items.map((i) => i.confidence)).toEqual(["sure", null, null]);
    for (const item of items) {
      expect(item.question.prompt).toBeTruthy();
      expect(item.explanations[item.correctAlternativeId]).toBeTruthy();
      expect(Object.keys(item.explanations)).toHaveLength(item.question.alternatives.length);
    }
  });

  it("shows the full correction of a finished mock Round", async () => {
    const { id } = await study();
    const round = await playRound(id, 2, [true, false], "mock");

    const { items } = await ctx.engine.getRoundReview(round.id);

    expect(items.map((i) => i.outcome)).toEqual(["correct", "incorrect"]);
    expect(items.map((i) => i.confidence)).toEqual(["sure", "sure"]);
  });

  it("reports a Round that does not exist, and a Round still being generated", async () => {
    const { id } = await study();
    await expect(ctx.engine.getRoundReview("11111111-1111-4111-8111-111111111111")).rejects.toMatchObject({
      code: "ROUND_NOT_FOUND",
    });
    const generating = await ctx.engine.createRound(id, { count: 2 });
    await expect(ctx.engine.getRoundReview(generating.id)).rejects.toMatchObject({ code: "ROUND_NOT_READY" });
  });

  it("refuses the history of a Study that does not exist", async () => {
    await expect(ctx.engine.listRoundHistory("11111111-1111-4111-8111-111111111111")).rejects.toMatchObject({
      code: "STUDY_NOT_FOUND",
    });
  });
});
