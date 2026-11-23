import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestEngine } from "./helpers";

let ctx: Awaited<ReturnType<typeof createTestEngine>>;
beforeEach(async () => {
  ctx = await createTestEngine();
});
afterEach(async () => {
  await ctx.cleanup();
});

const STAGES = [
  "topic-extraction",
  "excerpt-classification",
  "question-generation",
  "blind-resolution",
  "contestation-judgment",
] as const;

describe("Settings: models and prices", () => {
  it("starts with Sonnet 5.5 on every Stage and a filled price table", async () => {
    const settings = await ctx.engine.getSettings();

    expect(settings.stageModels).toEqual({
      "topic-extraction": "claude-sonnet-5-5",
      "excerpt-classification": "claude-sonnet-5-5",
      "question-generation": "claude-sonnet-5-5",
      "blind-resolution": "claude-sonnet-5-5",
      "contestation-judgment": "claude-sonnet-5-5",
    });
    expect(settings.offeredModels).toContain("claude-sonnet-5-5");
    expect(Object.keys(settings.prices).sort()).toEqual([...settings.offeredModels].sort());
    for (const price of Object.values(settings.prices)) {
      expect(price.input).toBeGreaterThan(0);
      expect(price.output).toBeGreaterThan(0);
      expect(price.cacheRead).toBeGreaterThan(0);
      expect(price.cacheWrite).toBeGreaterThan(0);
    }
    expect(Object.keys(settings.stageModels)).toEqual([...STAGES]);
  });

  it("makes the Claude calls of a Stage use the model chosen for it, and only that Stage", async () => {
    const study = await ctx.engine.createStudy({ name: "AWS SAA", goal: "Pass the SAA-C03 exam" });
    ctx.claude.whenExtractingTopics({ topics: ["IAM"] });
    await ctx.engine.requestTopicProposal(study.id);
    await ctx.engine.drainJobs();
    await ctx.engine.approveTopicProposal(study.id, ["IAM"]);

    await ctx.engine.setStageModel("question-generation", "claude-haiku-5-5");
    expect((await ctx.engine.getSettings()).stageModels["question-generation"]).toBe("claude-haiku-5-5");
    expect((await ctx.engine.getSettings()).stageModels["blind-resolution"]).toBe("claude-sonnet-5-5");

    await ctx.engine.createRound(study.id, { count: 2 });
    await ctx.engine.drainJobs();

    expect(ctx.claude.calls.extractTopics.map((c) => c.model)).toEqual(["claude-sonnet-5-5"]);
    expect(ctx.claude.calls.generateQuestions.map((c) => c.model)).toEqual(["claude-haiku-5-5"]);
    expect(ctx.claude.calls.resolveBlind.map((c) => c.model)).toEqual(["claude-sonnet-5-5"]);
  });

  it("records, in the usage entry, the model each call actually used", async () => {
    const study = await ctx.engine.createStudy({ name: "AWS SAA", goal: "Pass the SAA-C03 exam" });
    await ctx.engine.setStageModel("topic-extraction", "claude-opus-5-5");
    ctx.claude.whenExtractingTopics({ topics: ["IAM"] });
    await ctx.engine.requestTopicProposal(study.id);
    await ctx.engine.drainJobs();

    const records = await ctx.engine.listUsageRecords({ studyId: study.id });
    expect(records.map((r) => [r.stage, r.model])).toEqual([["topic-extraction", "claude-opus-5-5"]]);
  });

  it("rejects a model that is not offered, an unknown Stage and invalid prices, changing nothing", async () => {
    const before = await ctx.engine.getSettings();
    const valid = { input: 1, output: 2, cacheRead: 0.1, cacheWrite: 1.25 };

    await expect(ctx.engine.setStageModel("question-generation", "gpt-5")).rejects.toMatchObject({
      code: "MODEL_NOT_OFFERED",
    });
    await expect(ctx.engine.setStageModel("nonsense" as never, "claude-haiku-5-5")).rejects.toMatchObject({
      code: "STAGE_NOT_FOUND",
    });
    await expect(ctx.engine.setModelPrice("gpt-5", valid)).rejects.toMatchObject({ code: "MODEL_NOT_OFFERED" });
    await expect(ctx.engine.setModelPrice("claude-haiku-5-5", { ...valid, input: -1 })).rejects.toMatchObject({
      code: "PRICE_INVALID",
    });
    await expect(ctx.engine.setModelPrice("claude-haiku-5-5", { ...valid, output: Number.NaN })).rejects.toMatchObject({
      code: "PRICE_INVALID",
    });

    expect(await ctx.engine.getSettings()).toEqual(before);
  });

  it("accepts a price of zero", async () => {
    await ctx.engine.setModelPrice("claude-haiku-5-5", { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });
    expect((await ctx.engine.getSettings()).prices["claude-haiku-5-5"]).toEqual({
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
    });
  });

  it("edits the price of a model and keeps the other prices", async () => {
    const before = await ctx.engine.getSettings();

    await ctx.engine.setModelPrice("claude-haiku-5-5", { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 });

    const after = await ctx.engine.getSettings();
    expect(after.prices["claude-haiku-5-5"]).toEqual({ input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 });
    expect(after.prices["claude-opus-5-5"]).toEqual(before.prices["claude-opus-5-5"]);
  });
});
