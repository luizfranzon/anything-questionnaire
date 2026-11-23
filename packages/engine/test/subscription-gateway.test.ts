import { describe, expect, it } from "vitest";
import {
  ClaudeCredentialError,
  ClaudeModelUnavailableError,
  ClaudeNetworkError,
  ClaudeOverloadedError,
  ClaudeUsageLimitError,
} from "../src/application/ports/claude-gateway";
import { createSubscriptionClaudeGateway } from "../src/infrastructure/claude/subscription-claude-gateway";

/** A stand-in for the Agent SDK's `query`: replays the given messages and records how it was called. */
function simulatedSdk(messages: unknown[] | Error) {
  const calls: Array<{ prompt: string; options: Record<string, any> }> = [];
  const query = (params: { prompt: string; options?: Record<string, any> }) => {
    calls.push({ prompt: params.prompt, options: params.options ?? {} });
    return (async function* () {
      if (messages instanceof Error) throw messages;
      for (const message of messages) yield message;
    })();
  };
  return { query: query as never, calls };
}

const MODEL = "claude-sonnet-5-5";

function success(structured: unknown, modelUsage: Record<string, unknown> = defaultModelUsage()) {
  return {
    type: "result",
    subtype: "success",
    is_error: false,
    result: "",
    structured_output: structured,
    usage: {},
    modelUsage,
  };
}

function defaultModelUsage() {
  return {
    [MODEL]: { inputTokens: 120, outputTokens: 30, cacheReadInputTokens: 7, cacheCreationInputTokens: 5 },
  };
}

const gatewayWith = (messages: unknown[] | Error) => {
  const sdk = simulatedSdk(messages);
  return {
    sdk,
    gateway: createSubscriptionClaudeGateway({ oauthToken: "sk-ant-oat-test", query: sdk.query }),
  };
};

const extract = (gateway: ReturnType<typeof gatewayWith>["gateway"]) =>
  gateway.extractTopics({ studyId: "s", goal: "Pass the SAA-C03 exam", model: MODEL });

describe("Subscription adapter: contract with the Agent SDK", () => {
  it("asks for one turn, with no tools, no filesystem settings and only the subscription token", async () => {
    const { sdk, gateway } = gatewayWith([success({ topics: ["IAM", "VPC"] })]);

    const result = await extract(gateway);

    expect(result.output).toEqual({ topics: ["IAM", "VPC"] });
    expect(result.model).toBe(MODEL);
    expect(sdk.calls).toHaveLength(1);
    const { prompt, options } = sdk.calls[0];
    expect(prompt).toContain("Pass the SAA-C03 exam");
    expect(options).toMatchObject({
      model: MODEL,
      maxTurns: 5,
      tools: [],
      settingSources: [],
      persistSession: false,
      outputFormat: { type: "json_schema" },
    });
    expect(options.outputFormat.schema.properties).toHaveProperty("topics");
    expect(options.systemPrompt).toEqual(expect.stringContaining("Tópicos"));
    expect(options.env.CLAUDE_CODE_OAUTH_TOKEN).toBe("sk-ant-oat-test");
    expect(options.env.ANTHROPIC_API_KEY).toBeUndefined();
  });

  it("implements the other Stages with the same single-turn call", async () => {
    const question = {
      prompt: "Qual?",
      alternatives: [
        { text: "A", explanation: "certa" },
        { text: "B", explanation: "errada" },
      ],
      correctIndex: 0,
    };
    const generation = gatewayWith([success({ questions: [question] })]);
    const resolution = gatewayWith([success({ answers: [0, null] })]);

    const generated = await generation.gateway.generateQuestions({
      studyId: "s",
      roundId: "r",
      goal: "g",
      topic: { id: "t", name: "IAM" },
      difficulty: "medium",
      count: 1,
      model: MODEL,
    });
    const resolved = await resolution.gateway.resolveBlind({
      studyId: "s",
      roundId: "r",
      questions: [{ prompt: "Qual?", alternatives: ["A", "B"] }],
      model: MODEL,
    });

    expect(generated.output.questions).toEqual([question]);
    expect(generation.sdk.calls[0].prompt).toContain("IAM");
    expect(resolved.output.answers).toEqual([0, null]);
    for (const { options } of [...generation.sdk.calls, ...resolution.sdk.calls]) {
      expect(options).toMatchObject({ maxTurns: 5, tools: [], settingSources: [] });
    }
  });

  it("fails when the structured output does not match the schema", async () => {
    const { gateway } = gatewayWith([success({ topics: "not a list" })]);
    await expect(extract(gateway)).rejects.toThrow();
  });

  it("reports the consumption the SDK gave", async () => {
    const { gateway } = gatewayWith([success({ topics: ["IAM"] })]);
    expect((await extract(gateway)).usage).toEqual({
      inputTokens: 120,
      outputTokens: 30,
      cacheReadTokens: 7,
      cacheWriteTokens: 5,
    });
  });

  it("keeps what the SDK did not report as absent, not zero", async () => {
    const { gateway } = gatewayWith([
      success({ topics: ["IAM"] }, { [MODEL]: { inputTokens: 120, outputTokens: 30 } }),
    ]);
    expect((await extract(gateway)).usage).toEqual({
      inputTokens: 120,
      outputTokens: 30,
      cacheReadTokens: null,
      cacheWriteTokens: null,
    });
  });
});

describe("Subscription adapter: errors", () => {
  const failure = (extra: Record<string, unknown> = {}) => ({
    type: "result",
    subtype: "success",
    is_error: true,
    result: "failed",
    usage: {},
    modelUsage: {},
    ...extra,
  });

  it("maps an invalid or expired credential", async () => {
    for (const messages of [
      [{ type: "assistant", error: "authentication_failed", message: {} }, failure()],
      [failure({ api_error_status: 401 })],
      [{ type: "assistant", error: "oauth_org_not_allowed", message: {} }, failure()],
    ]) {
      await expect(extract(gatewayWith(messages).gateway)).rejects.toBeInstanceOf(ClaudeCredentialError);
    }
  });

  it("maps the usage limit, with the renewal time when the SDK gives it", async () => {
    const withReset = gatewayWith([
      { type: "rate_limit_event", rate_limit_info: { status: "rejected", resetsAt: 1_800_000_000 } },
      { type: "assistant", error: "rate_limit", message: {} },
      failure({ api_error_status: 429 }),
    ]);
    await expect(extract(withReset.gateway)).rejects.toMatchObject({
      name: "ClaudeUsageLimitError",
      resetsAt: new Date(1_800_000_000 * 1000),
    });

    const withoutReset = gatewayWith([{ type: "assistant", error: "rate_limit", message: {} }, failure()]);
    const error = await extract(withoutReset.gateway).catch((e) => e);
    expect(error).toBeInstanceOf(ClaudeUsageLimitError);
    expect(error.resetsAt).toBeUndefined();
  });

  it("does not treat a warning about the limit as a failure", async () => {
    const { gateway } = gatewayWith([
      { type: "rate_limit_event", rate_limit_info: { status: "allowed_warning", resetsAt: 1_800_000_000 } },
      success({ topics: ["IAM"] }),
    ]);
    expect((await extract(gateway)).output.topics).toEqual(["IAM"]);
  });

  it("maps overload and network failures, which are transient", async () => {
    await expect(
      extract(gatewayWith([{ type: "assistant", error: "overloaded", message: {} }, failure()]).gateway),
    ).rejects.toBeInstanceOf(ClaudeOverloadedError);
    await expect(
      extract(gatewayWith(Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" })).gateway),
    ).rejects.toBeInstanceOf(ClaudeNetworkError);
  });

  it("checks access with the same isolated single-turn call, asking for no structured output", async () => {
    const { sdk, gateway } = gatewayWith([success(undefined)]);

    await gateway.checkAccess({ model: "claude-haiku-5-5" });

    expect(sdk.calls).toHaveLength(1);
    expect(sdk.calls[0].options).toMatchObject({ model: "claude-haiku-5-5", maxTurns: 1, tools: [], settingSources: [] });
    expect(sdk.calls[0].options.outputFormat).toBeUndefined();
    expect(sdk.calls[0].options.env.CLAUDE_CODE_OAUTH_TOKEN).toBe("sk-ant-oat-test");
  });

  it("maps an account without access to the model, when checking access", async () => {
    const { gateway } = gatewayWith([{ type: "assistant", error: "model_not_found", message: {} }, failure()]);
    await expect(gateway.checkAccess({ model: "claude-haiku-5-5" })).rejects.toBeInstanceOf(ClaudeModelUnavailableError);
  });

  it("lets an unknown failure through unchanged", async () => {
    const boom = new Error("boom");
    await expect(extract(gatewayWith(boom).gateway)).rejects.toBe(boom);
  });
});
