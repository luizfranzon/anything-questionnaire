import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import {
  ClaudeCredentialError,
  ClaudeModelUnavailableError,
  ClaudeNetworkError,
  ClaudeOverloadedError,
  ClaudeUsageLimitError,
} from "../src/application/ports/claude-gateway";
import { createAnthropicClaudeGateway } from "../src/infrastructure/claude/anthropic-claude-gateway";

/** A stand-in for the Messages API client whose calls fail with the given error. */
function failingWith(error: Error) {
  const client = {
    messages: {
      parse: async () => {
        throw error;
      },
      create: async () => {
        throw error;
      },
    },
  };
  return createAnthropicClaudeGateway({ apiKey: "sk-test", client: client as never });
}

const extract = (gateway: ReturnType<typeof failingWith>) =>
  gateway.extractTopics({ studyId: "s", goal: "Pass the SAA-C03 exam", model: "claude-sonnet-5-5" });

const apiError = (status: number, headers: Record<string, string> = {}) =>
  Anthropic.APIError.generate(status, { type: "error" }, "failed", new Headers(headers));

describe("API adapter: errors, the same as the subscription adapter", () => {
  it("maps a rejected key to the credential error", async () => {
    await expect(extract(failingWith(apiError(401)))).rejects.toBeInstanceOf(ClaudeCredentialError);
    await expect(extract(failingWith(apiError(403)))).rejects.toBeInstanceOf(ClaudeCredentialError);
  });

  it("maps the rate limit to the usage limit error, with the renewal time when the API gives it", async () => {
    const before = Date.now();
    const error = await extract(failingWith(apiError(429, { "retry-after": "60" }))).catch((e) => e);
    expect(error).toBeInstanceOf(ClaudeUsageLimitError);
    expect(error.resetsAt.getTime()).toBeGreaterThanOrEqual(before + 60_000);

    const withoutTime = await extract(failingWith(apiError(429))).catch((e) => e);
    expect(withoutTime).toBeInstanceOf(ClaudeUsageLimitError);
    expect(withoutTime.resetsAt).toBeUndefined();
  });

  it("maps overload and connection failures, which are transient", async () => {
    await expect(extract(failingWith(apiError(529)))).rejects.toBeInstanceOf(ClaudeOverloadedError);
    await expect(
      extract(failingWith(new Anthropic.APIConnectionError({ message: "offline" }))),
    ).rejects.toBeInstanceOf(ClaudeNetworkError);
  });

  it("maps an unknown model to the model-unavailable error, when checking access", async () => {
    await expect(
      failingWith(apiError(404)).checkAccess({ model: "claude-haiku-5-5" }),
    ).rejects.toBeInstanceOf(ClaudeModelUnavailableError);
  });

  it("checks access with a minimal call", async () => {
    const calls: Array<Record<string, unknown>> = [];
    const client = {
      messages: {
        create: async (params: Record<string, unknown>) => {
          calls.push(params);
          return {};
        },
      },
    };
    const gateway = createAnthropicClaudeGateway({ apiKey: "sk-test", client: client as never });

    await gateway.checkAccess({ model: "claude-haiku-5-5" });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ model: "claude-haiku-5-5" });
    expect(calls[0].max_tokens as number).toBeLessThanOrEqual(16);
  });

  it("lets other failures through unchanged", async () => {
    const error = apiError(400);
    await expect(extract(failingWith(error))).rejects.toBe(error);
  });
});
