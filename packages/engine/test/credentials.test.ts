import { afterEach, describe, expect, it } from "vitest";
import { createFakeClaudeGateway } from "../src/index";
import { createCredentialUseCases } from "../src/application/use-cases/credential-use-cases";
import { createTestEngine } from "./helpers";

let ctx: Awaited<ReturnType<typeof createTestEngine>> | undefined;
afterEach(async () => {
  await ctx?.cleanup();
  ctx = undefined;
});

const SECRET = "sk-ant-oat01-abcdefghijklmnopqrstuvwxyz-1234";

describe("Credential: blocking without one", () => {
  it("reports that none is set and blocks what needs Claude until there is one", async () => {
    ctx = await createTestEngine({ credentials: {} });
    const study = await ctx.engine.createStudy({ name: "AWS SAA", goal: "Pass the SAA-C03 exam" });

    expect(await ctx.engine.getCredentialStatus()).toEqual({ configured: false });
    await expect(ctx.engine.requestTopicProposal(study.id)).rejects.toMatchObject({ code: "CREDENTIAL_REQUIRED" });
    expect(ctx.claude.calls.extractTopics).toHaveLength(0);
  });
});

describe("Credential: saving only after a real call succeeds", () => {
  it("validates with the cheapest model, then stores it and shows it masked", async () => {
    ctx = await createTestEngine({ credentials: {} });

    const status = await ctx.engine.saveCredential({ method: "subscription", secret: SECRET });

    expect(ctx.claude.calls.checkAccess).toEqual([{ model: "claude-haiku-5-5" }]);
    expect(ctx.usedCredentials).toEqual([{ method: "subscription", secret: SECRET }]);
    expect(status).toMatchObject({ configured: true, method: "subscription", source: "stored" });
    expect(await ctx.engine.getCredentialStatus()).toEqual(status);
    // Never returned whole: the mask hides the middle of the secret.
    const masked = (status as { masked: string }).masked;
    expect(masked).not.toContain("abcdefghijklmnopqrstuvwxyz");
    expect(masked.endsWith("1234")).toBe(true);
    expect(JSON.stringify(status)).not.toContain(SECRET);
  });

  it("does not record the validation call in the usage records", async () => {
    ctx = await createTestEngine({ credentials: {} });
    await ctx.engine.saveCredential({ method: "api-key", secret: "sk-ant-api03-whatever-5678" });
    expect(await ctx.engine.listUsageRecords()).toEqual([]);
  });

  it("stores nothing and says why when validation fails, and lets the user try again", async () => {
    ctx = await createTestEngine({ credentials: {} });
    const reasons: Array<[Error, string]> = [
      [ctx.claude.credentialRejected(), "CREDENTIAL_INVALID"],
      [ctx.claude.usageLimitReached(), "CREDENTIAL_USAGE_LIMIT"],
      [ctx.claude.modelUnavailable(), "CREDENTIAL_NO_MODEL_ACCESS"],
      [ctx.claude.offline(), "CREDENTIAL_NETWORK"],
    ];

    for (const [error, code] of reasons) {
      ctx.claude.whenChecking(error);
      await expect(ctx.engine.saveCredential({ method: "subscription", secret: SECRET })).rejects.toMatchObject({ code });
      expect(await ctx.engine.getCredentialStatus()).toEqual({ configured: false });
    }

    ctx.claude.whenChecking();
    expect(await ctx.engine.saveCredential({ method: "subscription", secret: SECRET })).toMatchObject({ configured: true });
  });

  it("rejects an empty secret or an unknown Method of access without calling Claude", async () => {
    ctx = await createTestEngine({ credentials: {} });
    await expect(ctx.engine.saveCredential({ method: "subscription", secret: "   " })).rejects.toMatchObject({
      code: "CREDENTIAL_SECRET_REQUIRED",
    });
    await expect(ctx.engine.saveCredential({ method: "magic" as never, secret: SECRET })).rejects.toMatchObject({
      code: "ACCESS_METHOD_INVALID",
    });
    expect(ctx.claude.calls.checkAccess).toHaveLength(0);
  });
});

describe("Credential: when the master key was lost", () => {
  it("treats a stored Credential that cannot be decrypted as missing, so the wizard can replace it", async () => {
    const stored = { method: "subscription" as const, secret: "encrypted-under-a-lost-key" };
    const repository = { find: async () => stored, save: async (next: typeof stored) => void Object.assign(stored, next) };
    const cipher = {
      encrypt: (plain: string) => `enc:${plain}`,
      decrypt: (blob: string) => {
        if (!blob.startsWith("enc:")) throw new Error("wrong key");
        return blob.slice(4);
      },
    };
    const claude = createFakeClaudeGateway();
    const credentials = createCredentialUseCases({
      credentials: repository,
      cipher,
      env: {},
      gatewayFor: () => claude.gateway,
      cheapestModel: async () => "claude-haiku-5-5",
    });

    expect(await credentials.getCredentialStatus()).toEqual({ configured: false });
    await expect(credentials.requireCredential()).rejects.toMatchObject({ code: "CREDENTIAL_REQUIRED" });

    expect(await credentials.saveCredential({ method: "subscription", secret: SECRET })).toMatchObject({
      configured: true,
      source: "stored",
    });
  });
});

describe("Credential: using it", () => {
  it("makes Claude calls use the stored Credential, and the new one after switching the Method of access", async () => {
    ctx = await createTestEngine({ credentials: {} });
    const study = await ctx.engine.createStudy({ name: "AWS SAA", goal: "Pass the SAA-C03 exam" });
    ctx.claude.whenExtractingTopics({ topics: ["IAM"] });

    await ctx.engine.saveCredential({ method: "api-key", secret: "sk-ant-api03-first-0001" });
    await ctx.engine.requestTopicProposal(study.id);
    await ctx.engine.drainJobs();
    expect(ctx.usedCredentials.at(-1)).toEqual({ method: "api-key", secret: "sk-ant-api03-first-0001" });

    await ctx.engine.saveCredential({ method: "subscription", secret: SECRET });
    expect(await ctx.engine.getCredentialStatus()).toMatchObject({ method: "subscription", source: "stored" });
    const second = await ctx.engine.createStudy({ name: "Other", goal: "Another goal" });
    await ctx.engine.requestTopicProposal(second.id);
    await ctx.engine.drainJobs();
    expect(ctx.usedCredentials.at(-1)).toEqual({ method: "subscription", secret: SECRET });
  });

  it("gives the environment variable priority over the stored Credential and says so", async () => {
    ctx = await createTestEngine({ credentials: { env: { CLAUDE_CODE_OAUTH_TOKEN: "sk-ant-oat01-from-env-9999" } } });
    const study = await ctx.engine.createStudy({ name: "AWS SAA", goal: "Pass the SAA-C03 exam" });

    // With the variable set there is already a Credential, so nothing blocks.
    expect(await ctx.engine.getCredentialStatus()).toMatchObject({
      configured: true,
      method: "subscription",
      source: "environment",
    });

    await ctx.engine.saveCredential({ method: "api-key", secret: "sk-ant-api03-stored-0002" });
    expect(await ctx.engine.getCredentialStatus()).toMatchObject({ method: "subscription", source: "environment" });

    ctx.claude.whenExtractingTopics({ topics: ["IAM"] });
    await ctx.engine.requestTopicProposal(study.id);
    await ctx.engine.drainJobs();
    expect(ctx.usedCredentials.at(-1)).toEqual({ method: "subscription", secret: "sk-ant-oat01-from-env-9999" });
  });
});
