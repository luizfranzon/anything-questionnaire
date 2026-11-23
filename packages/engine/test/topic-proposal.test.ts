import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestEngine } from "./helpers";

let ctx: Awaited<ReturnType<typeof createTestEngine>>;
beforeEach(async () => {
  ctx = await createTestEngine();
});
afterEach(async () => {
  await ctx.cleanup();
});

const MISSING_ID = "00000000-0000-0000-0000-000000000000";

async function newStudy() {
  return ctx.engine.createStudy({ name: "AWS SAA", goal: "Pass the SAA-C03 exam" });
}

describe("Topic proposal", () => {
  it("proposes Topics in the background from the Goal", async () => {
    const study = await newStudy();
    ctx.claude.whenExtractingTopics({ topics: ["IAM", "VPC", "S3"] });

    const requested = await ctx.engine.requestTopicProposal(study.id);
    expect(requested.phase).toBe("generating");
    expect(await ctx.engine.getTopicProposal(study.id)).toMatchObject({ phase: "generating", topics: [] });

    await ctx.engine.drainJobs();

    expect(await ctx.engine.getTopicProposal(study.id)).toMatchObject({
      phase: "ready",
      topics: ["IAM", "VPC", "S3"],
    });
    expect(ctx.claude.calls.extractTopics).toEqual([
      { studyId: study.id, goal: "Pass the SAA-C03 exam", model: "claude-sonnet-5-5" },
    ]);
  });

  it("returns the same proposal when requested again while it is in flight or ready", async () => {
    const study = await newStudy();
    ctx.claude.whenExtractingTopics({ topics: ["IAM"] });
    const first = await ctx.engine.requestTopicProposal(study.id);
    expect((await ctx.engine.requestTopicProposal(study.id)).id).toBe(first.id);
    await ctx.engine.drainJobs();
    expect((await ctx.engine.requestTopicProposal(study.id)).id).toBe(first.id);
    expect(ctx.claude.calls.extractTopics).toHaveLength(1);
  });

  it("retries transient failures automatically and reports the retrying phase", async () => {
    const study = await newStudy();
    ctx.claude.whenExtractingTopics(ctx.claude.overloaded(), ctx.claude.overloaded(), { topics: ["IAM"] });
    await ctx.engine.requestTopicProposal(study.id);

    await ctx.engine.drainJobs();

    expect(await ctx.engine.getTopicProposal(study.id)).toMatchObject({ phase: "ready", topics: ["IAM"] });
    expect(ctx.claude.calls.extractTopics).toHaveLength(3);
  });

  it("ends the proposal as failed, and lets the user try again, for each typed Claude error", async () => {
    for (const error of [
      ctx.claude.credentialRejected(),
      ctx.claude.usageLimitReached(new Date("2026-03-01T15:00:00Z")),
      ctx.claude.offline(),
    ]) {
      const study = await newStudy();
      ctx.claude.whenExtractingTopics(error);
      await ctx.engine.requestTopicProposal(study.id);
      await ctx.engine.drainJobs();
      expect((await ctx.engine.getTopicProposal(study.id))?.phase).toBe("failed");
      expect(await ctx.engine.listUsageRecords({ studyId: study.id })).toEqual([]);
    }
  });

  it("fails after exhausting the retries and can be requested again", async () => {
    const study = await newStudy();
    ctx.claude.whenExtractingTopics(ctx.claude.overloaded());
    const failed = await ctx.engine.requestTopicProposal(study.id);
    await ctx.engine.drainJobs();
    expect((await ctx.engine.getTopicProposal(study.id))?.phase).toBe("failed");

    ctx.claude.whenExtractingTopics({ topics: ["IAM"] });
    const again = await ctx.engine.requestTopicProposal(study.id);
    expect(again.id).not.toBe(failed.id);
    await ctx.engine.drainJobs();
    expect(await ctx.engine.getTopicProposal(study.id)).toMatchObject({ phase: "ready", topics: ["IAM"] });
  });

  it("cleans up what Claude returns: trims, drops empty and duplicate names", async () => {
    const study = await newStudy();
    ctx.claude.whenExtractingTopics({ topics: [" IAM ", "", "iam", "VPC"] });
    await ctx.engine.requestTopicProposal(study.id);
    await ctx.engine.drainJobs();
    expect((await ctx.engine.getTopicProposal(study.id))?.topics).toEqual(["IAM", "VPC"]);
  });

  it("fails to request for an unknown Study", async () => {
    await expect(ctx.engine.requestTopicProposal(MISSING_ID)).rejects.toMatchObject({ code: "STUDY_NOT_FOUND" });
    expect(await ctx.engine.getTopicProposal(MISSING_ID)).toBeNull();
  });
});

describe("Topic approval", () => {
  async function readyProposal(topics: string[]) {
    const study = await newStudy();
    ctx.claude.whenExtractingTopics({ topics });
    await ctx.engine.requestTopicProposal(study.id);
    await ctx.engine.drainJobs();
    return study;
  }

  it("keeps only the approved Topics, including edits", async () => {
    const study = await readyProposal(["IAM", "VPC", "S3", "Lambda"]);

    // The user renamed IAM, deleted S3 and Lambda, and added EC2.
    const approved = await ctx.engine.approveTopicProposal(study.id, ["Identity and Access", "VPC", "EC2"]);

    expect(approved.map((t) => t.name)).toEqual(["Identity and Access", "VPC", "EC2"]);
    expect((await ctx.engine.listTopics(study.id)).map((t) => t.name)).toEqual(["Identity and Access", "VPC", "EC2"]);
    expect(await ctx.engine.getTopicProposal(study.id)).toBeNull();
  });

  it("rejects invalid lists and keeps the proposal", async () => {
    const study = await readyProposal(["IAM"]);
    await expect(ctx.engine.approveTopicProposal(study.id, [])).rejects.toMatchObject({ code: "TOPICS_REQUIRED" });
    await expect(ctx.engine.approveTopicProposal(study.id, ["  "])).rejects.toMatchObject({
      code: "TOPIC_NAME_REQUIRED",
    });
    await expect(ctx.engine.approveTopicProposal(study.id, ["x".repeat(81)])).rejects.toMatchObject({
      code: "TOPIC_NAME_TOO_LONG",
    });
    await expect(ctx.engine.approveTopicProposal(study.id, ["IAM", "iam"])).rejects.toMatchObject({
      code: "TOPIC_NAME_DUPLICATE",
    });
    expect(await ctx.engine.listTopics(study.id)).toEqual([]);
    expect((await ctx.engine.getTopicProposal(study.id))?.phase).toBe("ready");
  });

  it("rejects approval when there is no proposal or it is not ready", async () => {
    const study = await newStudy();
    await expect(ctx.engine.approveTopicProposal(study.id, ["IAM"])).rejects.toMatchObject({
      code: "PROPOSAL_NOT_FOUND",
    });
    ctx.claude.whenExtractingTopics({ topics: ["IAM"] });
    await ctx.engine.requestTopicProposal(study.id);
    await expect(ctx.engine.approveTopicProposal(study.id, ["IAM"])).rejects.toMatchObject({
      code: "PROPOSAL_NOT_READY",
    });
  });
});

describe("Usage records", () => {
  it("keeps a token count the adapter did not report as absent, distinct from zero", async () => {
    const study = await newStudy();
    ctx.claude.whenExtractingTopics({
      topics: ["IAM"],
      usage: { inputTokens: 50, outputTokens: 10, cacheReadTokens: null, cacheWriteTokens: 0 },
    });
    await ctx.engine.requestTopicProposal(study.id);
    await ctx.engine.drainJobs();

    const [record] = await ctx.engine.listUsageRecords({ studyId: study.id });
    expect(record).toMatchObject({ inputTokens: 50, outputTokens: 10, cacheReadTokens: null, cacheWriteTokens: 0 });
  });

  it("records one entry per successful Claude call with Stage, model, Study, tokens and date", async () => {
    const study = await newStudy();
    ctx.clock.set(new Date("2026-03-01T10:00:00Z"));
    ctx.claude.whenExtractingTopics(ctx.claude.overloaded(), {
      topics: ["IAM"],
      model: "claude-opus-5-5",
      usage: { inputTokens: 120, outputTokens: 30, cacheReadTokens: 7, cacheWriteTokens: 5 },
    });
    await ctx.engine.requestTopicProposal(study.id);
    await ctx.engine.drainJobs();

    expect(await ctx.engine.listUsageRecords({ studyId: study.id })).toEqual([
      {
        stage: "topic-extraction",
        model: "claude-opus-5-5",
        studyId: study.id,
        roundId: null,
        inputTokens: 120,
        outputTokens: 30,
        cacheReadTokens: 7,
        cacheWriteTokens: 5,
        createdAt: new Date("2026-03-01T10:00:00Z"),
      },
    ]);
  });
});
