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

async function extractTopics(studyName: string, usage: Record<string, number>) {
  const study = await ctx.engine.createStudy({ name: studyName, goal: "Pass the exam" });
  ctx.claude.whenExtractingTopics({ topics: ["IAM"], usage });
  await ctx.engine.requestTopicProposal(study.id);
  await ctx.engine.drainJobs();
  return study;
}

describe("Usage metrics", () => {
  it("totals each kind of token and prices the cost from the current price table", async () => {
    await extractTopics("AWS SAA", {
      inputTokens: 1_000_000,
      outputTokens: 100_000,
      cacheReadTokens: 2_000_000,
      cacheWriteTokens: 400_000,
    });

    const { totals } = await ctx.engine.getUsageMetrics();

    expect(totals).toMatchObject({
      inputTokens: 1_000_000,
      outputTokens: 100_000,
      cacheReadTokens: 2_000_000,
      cacheWriteTokens: 400_000,
    });
    // Sonnet 5.5: US$ 3 in, 15 out, 0.3 cache read, 3.75 cache write per 1M tokens.
    expect(totals.costUsd).toBeCloseTo(3 + 1.5 + 0.6 + 1.5, 6);
  });

  it("reprices past calls when the user edits the price table, since cost is computed on the query", async () => {
    await extractTopics("AWS SAA", { inputTokens: 1_000_000, outputTokens: 0 });
    expect((await ctx.engine.getUsageMetrics()).totals.costUsd).toBeCloseTo(3, 9);

    await ctx.engine.setModelPrice("claude-sonnet-5-5", { input: 10, output: 15, cacheRead: 0.3, cacheWrite: 3.75 });

    expect((await ctx.engine.getUsageMetrics()).totals.costUsd).toBeCloseTo(10, 9);
  });

  it("gives a series per day (UTC) and Stage, oldest first, with days that had no calls left out", async () => {
    ctx.clock.set(new Date("2026-01-01T23:30:00Z"));
    await extractTopics("First", { inputTokens: 1000, outputTokens: 10 });
    ctx.clock.set(new Date("2026-01-02T00:10:00Z"));
    await extractTopics("Second", { inputTokens: 2000, outputTokens: 20 });
    await extractTopics("Third", { inputTokens: 500, outputTokens: 5 });
    ctx.clock.set(new Date("2026-01-05T12:00:00Z"));
    await extractTopics("Fourth", { inputTokens: 40, outputTokens: 4 });

    const { series } = await ctx.engine.getUsageMetrics();

    expect(series.map((p) => [p.date, p.stage, p.inputTokens, p.outputTokens])).toEqual([
      ["2026-01-01", "topic-extraction", 1000, 10],
      ["2026-01-02", "topic-extraction", 2500, 25],
      ["2026-01-05", "topic-extraction", 40, 4],
    ]);
    expect(series[1].costUsd).toBeCloseTo((2500 * 3 + 25 * 15) / 1_000_000, 9);
  });

  describe("filters", () => {
    // A: extraction on Jan 1 (1000 in) and question generation on Jan 3 (5000 in).
    // B: extraction on Jan 3 (200 in).
    let studyA: { id: string };
    let studyB: { id: string };
    beforeEach(async () => {
      ctx.clock.set(new Date("2026-01-01T10:00:00Z"));
      studyA = await extractTopics("A", { inputTokens: 1000, outputTokens: 0 });
      await ctx.engine.approveTopicProposal(studyA.id, ["IAM"]);
      ctx.clock.set(new Date("2026-01-03T10:00:00Z"));
      ctx.claude.whenGeneratingQuestions((request) => ({
        questions: Array.from({ length: request.count }, (_, i) => sampleQuestion(`Q${i}`)),
        usage: { inputTokens: 5000, outputTokens: 0 },
      }));
      ctx.claude.whenResolvingBlind({ usage: { inputTokens: 10, outputTokens: 0 } });
      await ctx.engine.createRound(studyA.id, { count: 1 });
      await ctx.engine.drainJobs();
      studyB = await extractTopics("B", { inputTokens: 200, outputTokens: 0 });
    });

    const inputOf = async (filter: Parameters<typeof ctx.engine.getUsageMetrics>[0]) =>
      (await ctx.engine.getUsageMetrics(filter)).totals.inputTokens;

    it("narrows by Study", async () => {
      expect(await inputOf({ studyId: studyA.id })).toBe(1000 + 5000 + 10);
      expect(await inputOf({ studyId: studyB.id })).toBe(200);
    });

    it("narrows by Stage", async () => {
      expect(await inputOf({ stage: "topic-extraction" })).toBe(1000 + 200);
      expect(await inputOf({ stage: "question-generation" })).toBe(5000);
    });

    it("narrows by period, with both ends inclusive", async () => {
      expect(await inputOf({ from: new Date("2026-01-02T00:00:00Z") })).toBe(5000 + 10 + 200);
      expect(await inputOf({ to: new Date("2026-01-02T00:00:00Z") })).toBe(1000);
      expect(
        await inputOf({ from: new Date("2026-01-01T10:00:00Z"), to: new Date("2026-01-03T10:00:00Z") }),
      ).toBe(1000 + 5000 + 10 + 200);
    });

    it("combines the filters", async () => {
      expect(
        await inputOf({ studyId: studyA.id, stage: "topic-extraction", from: new Date("2026-01-02T00:00:00Z") }),
      ).toBe(0);
      expect(
        await inputOf({ stage: "topic-extraction", from: new Date("2026-01-02T00:00:00Z") }),
      ).toBe(200);
      expect(await inputOf({ studyId: studyA.id, stage: "topic-extraction" })).toBe(1000);
    });

    it("applies the filters to the Stage breakdown and the series too", async () => {
      const { byStage, series } = await ctx.engine.getUsageMetrics({ studyId: studyB.id });

      expect(byStage.map((s) => s.stage)).toEqual(["topic-extraction"]);
      expect(series.map((p) => [p.date, p.inputTokens])).toEqual([["2026-01-03", 200]]);
    });

    it("returns empty metrics for a Study that does not exist", async () => {
      const metrics = await ctx.engine.getUsageMetrics({ studyId: "not-a-study" });

      expect(metrics.byStage).toEqual([]);
      expect(metrics.series).toEqual([]);
      expect(metrics.totals.inputTokens).toBe(0);
      expect(metrics.totals.cacheHitRate).toBeNull();
    });
  });

  it("breaks the consumption down per Stage, in pipeline order, leaving out Stages with no calls", async () => {
    const study = await extractTopics("AWS SAA", { inputTokens: 1000, outputTokens: 100 });
    await ctx.engine.approveTopicProposal(study.id, ["IAM"]);
    ctx.claude.whenGeneratingQuestions((request) => ({
      questions: Array.from({ length: request.count }, (_, i) => sampleQuestion(`Q${i}`)),
      usage: { inputTokens: 5000, outputTokens: 700 },
    }));
    ctx.claude.whenResolvingBlind({ usage: { inputTokens: 300, outputTokens: 30 } });
    await ctx.engine.createRound(study.id, { count: 1 });
    await ctx.engine.drainJobs();

    const { byStage, totals } = await ctx.engine.getUsageMetrics();

    expect(byStage.map((s) => [s.stage, s.inputTokens, s.outputTokens])).toEqual([
      ["topic-extraction", 1000, 100],
      ["question-generation", 5000, 700],
      ["blind-resolution", 300, 30],
    ]);
    expect(totals.inputTokens).toBe(6300);
    // Sonnet: 5000 in * 3 + 700 out * 15 per 1M tokens
    expect(byStage[1].costUsd).toBeCloseTo((5000 * 3 + 700 * 15) / 1_000_000, 9);
  });

  it("gives the cache hit rate per Stage as cache reads over all input-side tokens", async () => {
    const study = await extractTopics("AWS SAA", {
      inputTokens: 1000,
      outputTokens: 100,
      cacheReadTokens: 3000,
      cacheWriteTokens: 1000,
    });
    await ctx.engine.approveTopicProposal(study.id, ["IAM"]);
    ctx.claude.whenGeneratingQuestions((request) => ({
      questions: Array.from({ length: request.count }, (_, i) => sampleQuestion(`Q${i}`)),
      usage: { inputTokens: 500, outputTokens: 50, cacheReadTokens: 0, cacheWriteTokens: 0 },
    }));
    await ctx.engine.createRound(study.id, { count: 1 });
    await ctx.engine.drainJobs();

    const { byStage, totals } = await ctx.engine.getUsageMetrics();
    const rate = (stage: string) => byStage.find((s) => s.stage === stage)?.cacheHitRate;

    expect(rate("topic-extraction")).toBeCloseTo(0.6, 9); // 3000 / (1000 + 3000 + 1000)
    expect(rate("question-generation")).toBe(0); // nothing read from the cache
    // Input side of the whole period: 5000 (extraction) + 500 (generation) + 100 (the fake's default blind call).
    expect(totals.cacheHitRate).toBeCloseTo(3000 / 5600, 9);
  });

  it("has no cache hit rate when a Stage sent no input-side tokens at all", async () => {
    await extractTopics("AWS SAA", { inputTokens: 0, outputTokens: 100, cacheReadTokens: 0, cacheWriteTokens: 0 });

    const { byStage } = await ctx.engine.getUsageMetrics();

    expect(byStage[0].cacheHitRate).toBeNull();
  });
});
