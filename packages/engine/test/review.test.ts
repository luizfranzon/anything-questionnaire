import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestEngine } from "./helpers";

let ctx: Awaited<ReturnType<typeof createTestEngine>>;
beforeEach(async () => {
  ctx = await createTestEngine();
});
afterEach(async () => {
  await ctx.cleanup();
});

const DAY = 86_400_000;
const advanceDays = (days: number) => ctx.clock.set(new Date(ctx.clock.now().getTime() + days * DAY));

async function studyWithTopics(names: string[]) {
  const study = await ctx.engine.createStudy({ name: "AWS SAA", goal: "Pass the SAA-C03 exam" });
  ctx.claude.whenExtractingTopics({ topics: names });
  await ctx.engine.requestTopicProposal(study.id);
  await ctx.engine.drainJobs();
  await ctx.engine.approveTopicProposal(study.id, names);
  return study;
}

type Move = "right" | "wrong" | "dontknow" | "doubt";

/** Creates a Round and answers all of it. Returns the ids in presentation order. */
async function play(studyId: string, count: number, move: Move | ((index: number) => Move) = "right") {
  const round = await ctx.engine.createRound(studyId, { count });
  await ctx.engine.drainJobs();
  const ids: string[] = [];
  for (;;) {
    const next = await ctx.engine.getNextQuestion(round.id);
    if (!next) return { round, ids };
    const { question } = next;
    ids.push(question.id);
    const how = typeof move === "function" ? move(ids.length - 1) : move;
    const correct = question.alternatives.find((a) => a.text.endsWith("opção A"))!.id;
    const wrong = question.alternatives.find((a) => !a.text.endsWith("opção A"))!.id;
    await ctx.engine.answerQuestion(round.id, question.id, {
      choice: how === "dontknow" ? null : how === "wrong" ? wrong : correct,
    });
    if (how === "doubt") await ctx.engine.setAnswerConfidence(round.id, question.id, "doubt");
  }
}

const generatedCount = () => ctx.claude.calls.generateQuestions.reduce((sum, c) => sum + c.count, 0);

describe("Revisões", () => {
  it("fall due at different days depending on how the Answer went", async () => {
    const study = await studyWithTopics(["IAM"]);
    await play(study.id, 3, (i) => (["right", "wrong", "doubt"] as const)[i]);
    expect(await ctx.engine.countDueReviews(study.id)).toBe(0);

    // "Errei" returns first, then "Difícil", then "Bom": the harder it was, the sooner it comes back.
    const due: number[] = [];
    for (let day = 1; day <= 60; day++) {
      advanceDays(1);
      due.push(await ctx.engine.countDueReviews(study.id));
    }
    expect(due[0]).toBe(1);
    expect(due[59]).toBe(3);
    expect(due.every((n, i) => i === 0 || n >= due[i - 1])).toBe(true);
    const firstDayWith = (n: number) => due.indexOf(n) + 1;
    expect(firstDayWith(1)).toBeLessThan(firstDayWith(2));
    expect(firstDayWith(2)).toBeLessThan(firstDayWith(3));
  });

  it("treats \"Não sei\" like a mistake", async () => {
    const study = await studyWithTopics(["IAM"]);
    await play(study.id, 2, (i) => (i === 0 ? "dontknow" : "right"));
    advanceDays(1);
    expect(await ctx.engine.countDueReviews(study.id)).toBe(1);
  });

  it("reschedules when Confidence is declared after the Answer", async () => {
    const doubt = await studyWithTopics(["IAM"]);
    await play(doubt.id, 1, "doubt");
    const sure = await studyWithTopics(["VPC"]);
    await play(sure.id, 1, "right");
    let doubtDay = 0;
    let sureDay = 0;
    for (let day = 1; day <= 60 && !(doubtDay && sureDay); day++) {
      advanceDays(1);
      if (!doubtDay && (await ctx.engine.countDueReviews(doubt.id)) > 0) doubtDay = day;
      if (!sureDay && (await ctx.engine.countDueReviews(sure.id)) > 0) sureDay = day;
    }
    expect(doubtDay).toBeGreaterThan(0);
    expect(doubtDay).toBeLessThan(sureDay);
  });

  it("enter a Round first, up to 30%, and the rest is new", async () => {
    const study = await studyWithTopics(["IAM"]);
    const { ids: old } = await play(study.id, 10, "wrong");
    const before = generatedCount();
    advanceDays(40);
    expect(await ctx.engine.countDueReviews(study.id)).toBe(10);

    const round = await ctx.engine.createRound(study.id, { count: 10 });
    await ctx.engine.drainJobs();
    expect(generatedCount() - before).toBe(7);

    const presented: string[] = [];
    for (let next = await ctx.engine.getNextQuestion(round.id); next; next = await ctx.engine.getNextQuestion(round.id)) {
      presented.push(next.question.id);
      await ctx.engine.answerQuestion(round.id, next.question.id, { choice: null });
    }
    expect(presented).toHaveLength(10);
    expect(presented.slice(0, 3).every((id) => old.includes(id))).toBe(true);
    expect(presented.slice(3).some((id) => old.includes(id))).toBe(false);
  });

  it("round the 30% limit down, so a Round too small for one Revisão has none", async () => {
    const study = await studyWithTopics(["IAM"]);
    await play(study.id, 5, "wrong");
    const before = generatedCount();
    advanceDays(40);
    await ctx.engine.createRound(study.id, { count: 3 });
    await ctx.engine.drainJobs();
    expect(generatedCount() - before).toBe(3);
  });

  it("fill only what is due and complete the Round with new Questions", async () => {
    const study = await studyWithTopics(["IAM"]);
    await play(study.id, 1, "wrong");
    const before = generatedCount();
    advanceDays(5);
    const round = await ctx.engine.createRound(study.id, { count: 10 });
    await ctx.engine.drainJobs();
    expect(generatedCount() - before).toBe(9);
    expect(await ctx.engine.getRound(round.id)).toMatchObject({ phase: "ready", generated: 10 });
  });

  it("do not enter a Round that leaves their Topic out", async () => {
    const study = await studyWithTopics(["IAM", "VPC"]);
    await play(study.id, 10, "wrong");
    advanceDays(40);
    const iam = (await ctx.engine.listTopics(study.id)).find((t) => t.name === "IAM")!;
    const round = await ctx.engine.createRound(study.id, { count: 10, topicIds: [iam.id] });
    await ctx.engine.drainJobs();
    for (let next = await ctx.engine.getNextQuestion(round.id); next; next = await ctx.engine.getNextQuestion(round.id)) {
      expect(next.question.topic).toBe("IAM");
      await ctx.engine.answerQuestion(round.id, next.question.id, { choice: null });
    }
  });

  it("shuffle the Alternativas on each presentation without breaking the correction", async () => {
    const study = await studyWithTopics(["IAM"]);
    const round = await ctx.engine.createRound(study.id, { count: 1 });
    await ctx.engine.drainJobs();
    const orders = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const next = (await ctx.engine.getNextQuestion(round.id))!;
      orders.add(next.question.alternatives.map((a) => a.text).join("|"));
    }
    expect(orders.size).toBeGreaterThan(1);

    const { question } = (await ctx.engine.getNextQuestion(round.id))!;
    const correct = question.alternatives.find((a) => a.text.endsWith("opção A"))!;
    const correction = await ctx.engine.answerQuestion(round.id, question.id, { choice: correct.id });
    expect(correction).toMatchObject({ outcome: "correct", correctAlternativeId: correct.id });
  });
});
