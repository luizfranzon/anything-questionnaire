import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sampleQuestion } from "../src/index";
import { createTestEngine } from "./helpers";

let ctx: Awaited<ReturnType<typeof createTestEngine>>;
beforeEach(async () => {
  ctx = await createTestEngine();
});
afterEach(async () => {
  await ctx.cleanup();
});

async function studyWithTopics(names: string[]) {
  const study = await ctx.engine.createStudy({ name: "AWS SAA", goal: "Pass the SAA-C03 exam" });
  ctx.claude.whenExtractingTopics({ topics: names });
  await ctx.engine.requestTopicProposal(study.id);
  await ctx.engine.drainJobs();
  const topics = await ctx.engine.approveTopicProposal(study.id, names);
  return { study, topics };
}

/** `sampleQuestion` makes "opção A" the correct Alternative; the order is shuffled, so find it by text. */
const correctOf = (alternatives: Array<{ id: string; text: string }>) =>
  alternatives.find((a) => a.text.endsWith("opção A"))!.id;
const wrongOf = (alternatives: Array<{ id: string; text: string }>) =>
  alternatives.find((a) => !a.text.endsWith("opção A"))!.id;

async function readyRound(count: number, topics = ["IAM", "VPC"]) {
  const { study } = await studyWithTopics(topics);
  const round = await ctx.engine.createRound(study.id, { count });
  await ctx.engine.drainJobs();
  return { study, round };
}

describe("Round generation", () => {
  it("queues the generation and becomes ready only when the requested count is reached", async () => {
    const { study } = await studyWithTopics(["IAM", "VPC"]);

    const created = await ctx.engine.createRound(study.id, { count: 4 });
    expect(created).toMatchObject({ phase: "generating", count: 4, generated: 0 });

    await ctx.engine.drainJobs();

    expect(await ctx.engine.getRound(created.id)).toMatchObject({ phase: "ready", count: 4, generated: 4 });
  });

  it("distributes the Questions equally among the active Topics", async () => {
    const { study, topics } = await studyWithTopics(["IAM", "VPC", "S3"]);
    const round = await ctx.engine.createRound(study.id, { count: 7 });
    await ctx.engine.drainJobs();

    const perTopic = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const next = await ctx.engine.getNextQuestion(round.id);
      const q = next!.question;
      perTopic.set(q.topic, (perTopic.get(q.topic) ?? 0) + 1);
      await ctx.engine.answerQuestion(round.id, q.id, { choice: null });
    }
    const counts = topics.map((t) => perTopic.get(t.name));
    expect(counts.sort()).toEqual([2, 2, 3]);
  });

  it("restricts the Round to the chosen Topics", async () => {
    const { study, topics } = await studyWithTopics(["IAM", "VPC", "S3"]);
    const round = await ctx.engine.createRound(study.id, { count: 3, topicIds: [topics[1].id] });
    await ctx.engine.drainJobs();

    expect(ctx.claude.calls.generateQuestions.map((c) => c.topic.name)).toEqual(["VPC"]);
    expect((await ctx.engine.getNextQuestion(round.id))!.question.topic).toBe("VPC");
  });

  it("retries a transient failure and resumes without duplicating Questions", async () => {
    const { study } = await studyWithTopics(["IAM", "VPC"]);
    ctx.claude.whenGeneratingQuestions(
      { questions: [sampleQuestion("IAM 1"), sampleQuestion("IAM 2")] },
      ctx.claude.overloaded(),
      (request) => ({ questions: [sampleQuestion(`${request.topic.name} 3`), sampleQuestion(`${request.topic.name} 4`)] }),
    );
    const round = await ctx.engine.createRound(study.id, { count: 4 });
    await ctx.engine.drainJobs();

    expect(await ctx.engine.getRound(round.id)).toMatchObject({ phase: "ready", generated: 4 });
    // IAM was already complete when the retry started, so the retry asked only for VPC.
    expect(ctx.claude.calls.generateQuestions.map((c) => c.topic.name)).toEqual(["IAM", "VPC", "VPC"]);
  });

  it("fails after exhausting the retries and reports it", async () => {
    const { study } = await studyWithTopics(["IAM"]);
    ctx.claude.whenGeneratingQuestions(ctx.claude.overloaded());
    const round = await ctx.engine.createRound(study.id, { count: 2 });
    await ctx.engine.drainJobs();
    expect(await ctx.engine.getRound(round.id)).toMatchObject({ phase: "failed", generated: 0 });
    await expect(ctx.engine.getNextQuestion(round.id)).rejects.toMatchObject({ code: "ROUND_NOT_READY" });
  });

  it("discards malformed Questions and asks again until the count is reached", async () => {
    const { study } = await studyWithTopics(["IAM"]);
    const noCorrect = { ...sampleQuestion("ruim 1"), correctIndex: 9 };
    const oneOption = { ...sampleQuestion("ruim 2"), alternatives: [sampleQuestion("x").alternatives[0]] };
    ctx.claude.whenGeneratingQuestions(
      { questions: [noCorrect, sampleQuestion("boa 1"), oneOption] },
      { questions: [sampleQuestion("boa 2"), sampleQuestion("boa 3")] },
    );
    const round = await ctx.engine.createRound(study.id, { count: 3 });
    await ctx.engine.drainJobs();

    expect(await ctx.engine.getRound(round.id)).toMatchObject({ phase: "ready", generated: 3 });
    expect(ctx.claude.calls.generateQuestions.map((c) => c.count)).toEqual([3, 2]);
  });

  it("records the usage of each generation call against the Round", async () => {
    const { study } = await studyWithTopics(["IAM"]);
    const round = await ctx.engine.createRound(study.id, { count: 2 });
    await ctx.engine.drainJobs();

    const records = (await ctx.engine.listUsageRecords({ studyId: study.id })).filter(
      (r) => r.stage === "question-generation",
    );
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ roundId: round.id, studyId: study.id });
  });

  it("rejects invalid requests", async () => {
    const empty = await ctx.engine.createStudy({ name: "Vazio", goal: "Sem Tópicos" });
    await expect(ctx.engine.createRound(empty.id, { count: 5 })).rejects.toMatchObject({ code: "NO_ACTIVE_TOPICS" });

    const { study } = await studyWithTopics(["IAM"]);
    for (const count of [0, 101, 2.5]) {
      await expect(ctx.engine.createRound(study.id, { count })).rejects.toMatchObject({ code: "ROUND_COUNT_INVALID" });
    }
    await expect(
      ctx.engine.createRound(study.id, { count: 5, topicIds: ["00000000-0000-0000-0000-000000000000"] }),
    ).rejects.toMatchObject({ code: "TOPIC_NOT_IN_STUDY" });
    await expect(
      ctx.engine.createRound("00000000-0000-0000-0000-000000000000", { count: 5 }),
    ).rejects.toMatchObject({ code: "STUDY_NOT_FOUND" });
    await expect(ctx.engine.getRound("00000000-0000-0000-0000-000000000000")).rejects.toMatchObject({
      code: "ROUND_NOT_FOUND",
    });
  });
});

describe("Answering a Round in study mode", () => {
  it("presents one Question at a time without revealing the Gabarito", async () => {
    const { round } = await readyRound(2);
    const next = await ctx.engine.getNextQuestion(round.id);

    expect(next).toMatchObject({ position: 1, total: 2 });
    expect(next!.question.alternatives).toHaveLength(4);
    expect(JSON.stringify(next)).not.toMatch(/certa|errada|correct/i);
  });

  it("shows the result, Gabarito and Explicação right after the Answer", async () => {
    const { round } = await readyRound(2);
    const { question } = (await ctx.engine.getNextQuestion(round.id))!;

    const correction = await ctx.engine.answerQuestion(round.id, question.id, { choice: wrongOf(question.alternatives) });

    expect(correction.outcome).toBe("incorrect");
    expect(correction.correctAlternativeId).toBe(correctOf(question.alternatives));
    // Why the right one is right and why every wrong one is wrong.
    expect(Object.keys(correction.explanations).sort()).toEqual(question.alternatives.map((a) => a.id).sort());
    expect(correction.explanations[correction.correctAlternativeId]).toMatch(/está certa/);
    expect(await ctx.engine.getRound(round.id)).toMatchObject({ phase: "in-progress", answered: 1 });
    expect((await ctx.engine.getNextQuestion(round.id))!.position).toBe(2);
  });

  it("counts \"Não sei\" as a mistake", async () => {
    const { round } = await readyRound(1);
    const { question } = (await ctx.engine.getNextQuestion(round.id))!;

    const correction = await ctx.engine.answerQuestion(round.id, question.id, { choice: null });

    expect(correction.outcome).toBe("incorrect");
    expect(await ctx.engine.getRoundResult(round.id)).toEqual({ correct: 0, total: 1, dontKnow: 1 });
  });

  it("records the Confidence of a correct Answer after it was given", async () => {
    const { round } = await readyRound(1);
    const { question } = (await ctx.engine.getNextQuestion(round.id))!;
    const correction = await ctx.engine.answerQuestion(round.id, question.id, { choice: correctOf(question.alternatives) });
    expect(correction).toMatchObject({ outcome: "correct", confidence: null });

    await ctx.engine.setAnswerConfidence(round.id, question.id, "doubt");

    expect(await ctx.engine.getRoundResult(round.id)).toMatchObject({ correct: 1 });
  });

  it("only takes Confidence for correct Answers that exist", async () => {
    const { round } = await readyRound(2);
    const { question } = (await ctx.engine.getNextQuestion(round.id))!;
    await expect(ctx.engine.setAnswerConfidence(round.id, question.id, "sure")).rejects.toMatchObject({
      code: "NOT_ANSWERED",
    });
    await ctx.engine.answerQuestion(round.id, question.id, { choice: wrongOf(question.alternatives) });
    await expect(ctx.engine.setAnswerConfidence(round.id, question.id, "sure")).rejects.toMatchObject({
      code: "CONFIDENCE_NOT_APPLICABLE",
    });
  });

  it("rejects answering twice, unknown Questions and unknown Alternatives", async () => {
    const { round } = await readyRound(2);
    const { question } = (await ctx.engine.getNextQuestion(round.id))!;
    await expect(ctx.engine.answerQuestion(round.id, question.id, { choice: "nope" })).rejects.toMatchObject({
      code: "ALTERNATIVE_NOT_FOUND",
    });
    await ctx.engine.answerQuestion(round.id, question.id, { choice: null });
    await expect(ctx.engine.answerQuestion(round.id, question.id, { choice: null })).rejects.toMatchObject({
      code: "ALREADY_ANSWERED",
    });
    await expect(
      ctx.engine.answerQuestion(round.id, "00000000-0000-0000-0000-000000000000", { choice: null }),
    ).rejects.toMatchObject({ code: "QUESTION_NOT_IN_ROUND" });
  });

  it("does not let a Round be played before it is ready", async () => {
    const { study } = await studyWithTopics(["IAM"]);
    const round = await ctx.engine.createRound(study.id, { count: 2 });
    await expect(ctx.engine.getNextQuestion(round.id)).rejects.toMatchObject({ code: "ROUND_NOT_READY" });
    await expect(ctx.engine.getRoundResult(round.id)).rejects.toMatchObject({ code: "ROUND_NOT_READY" });
  });

  it("shows hits out of total at the end of the Round", async () => {
    const { round } = await readyRound(3);
    let step = 0;
    for (let next = await ctx.engine.getNextQuestion(round.id); next; next = await ctx.engine.getNextQuestion(round.id)) {
      const alts = next.question.alternatives;
      // Right, wrong, right.
      await ctx.engine.answerQuestion(round.id, next.question.id, { choice: step++ === 1 ? wrongOf(alts) : correctOf(alts) });
    }

    expect(await ctx.engine.getRound(round.id)).toMatchObject({ phase: "completed", answered: 3 });
    expect(await ctx.engine.getRoundResult(round.id)).toEqual({ correct: 2, total: 3, dontKnow: 0 });
  });

  it("has no result before the Round is finished", async () => {
    const { round } = await readyRound(2);
    await expect(ctx.engine.getRoundResult(round.id)).rejects.toMatchObject({ code: "ROUND_NOT_COMPLETED" });
  });
});
