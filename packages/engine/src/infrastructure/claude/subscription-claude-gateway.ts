import { tmpdir } from "node:os";
import { query as agentSdkQuery } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import {
  ClaudeCredentialError,
  ClaudeModelUnavailableError,
  ClaudeNetworkError,
  ClaudeOverloadedError,
  ClaudeUsageLimitError,
  type ClaudeGateway,
  type StageResult,
} from "../../application/ports/claude-gateway";
import type { TokenUsage } from "../../domain/usage";
import {
  BLIND_RESOLUTION_SYSTEM,
  BlindResolutionSchema,
  QUESTION_GENERATION_SYSTEM,
  QuestionsSchema,
  TOPIC_EXTRACTION_SYSTEM,
  TopicsSchema,
  blindResolutionMessage,
  questionGenerationMessage,
  topicExtractionMessage,
} from "./prompts";

/** The one function of the Agent SDK this adapter uses. Contract tests replace it with a simulated one. */
export type AgentQuery = typeof agentSdkQuery;

export interface SubscriptionGatewayOptions {
  /** Token from `claude setup-token`. Handed to the SDK only through the process environment. */
  oauthToken: string;
  query?: AgentQuery;
}

const CREDENTIAL_ERRORS = new Set([
  "authentication_failed",
  "oauth_org_not_allowed",
  "account_on_hold",
  "verification_required",
  "cloud_credential_error",
]);
const USAGE_LIMIT_ERRORS = new Set(["rate_limit", "billing_error"]);
const NETWORK_ERROR_CODES = new Set(["ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "ETIMEDOUT", "EAI_AGAIN", "EPIPE"]);

interface Failure {
  assistantError?: string;
  apiStatus?: number | null;
  /** When the plan limit renews, in epoch seconds, as reported by a rejected rate limit event. */
  resetsAt?: number;
  text: string;
}

/** Same errors as the Messages API adapter, so the engine does not care which Method of access is in use. */
function toTypedError({ assistantError, apiStatus, resetsAt, text }: Failure): Error {
  if ((assistantError && CREDENTIAL_ERRORS.has(assistantError)) || apiStatus === 401 || apiStatus === 403) {
    return new ClaudeCredentialError();
  }
  if ((assistantError && USAGE_LIMIT_ERRORS.has(assistantError)) || apiStatus === 429 || resetsAt !== undefined) {
    return new ClaudeUsageLimitError(resetsAt === undefined ? undefined : new Date(resetsAt * 1000));
  }
  if (assistantError === "model_not_found" || apiStatus === 404) return new ClaudeModelUnavailableError();
  if (assistantError === "overloaded" || apiStatus === 529) return new ClaudeOverloadedError();
  if (assistantError === "server_error" || (apiStatus != null && apiStatus >= 500)) {
    return new ClaudeNetworkError(new Error(text));
  }
  return new Error(`Claude failed: ${text || assistantError || "unknown error"}`);
}

/**
 * The Claude Code CLI validates `--json-schema` offline and cannot resolve the `$schema` meta-schema URL that
 * Zod emits (draft 2020-12): it exits with code 1. The keyword is only a hint, so it is dropped.
 */
function outputSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _meta, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return rest;
}

function isNetworkFailure(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code ?? (error as { cause?: { code?: unknown } } | null)?.cause?.code;
  return typeof code === "string" && NETWORK_ERROR_CODES.has(code);
}

const asCount = (value: unknown): number | undefined => (typeof value === "number" ? value : undefined);

/** Sums the per-model totals. A field no model reported stays `null`: absent is not zero. */
function toUsage(result: { modelUsage?: Record<string, any>; usage?: Record<string, any> }): TokenUsage {
  const entries = Object.values(result.modelUsage ?? {});
  const total = (modelField: string, usageField: string): number | null => {
    const values = entries.map((entry) => asCount(entry?.[modelField])).filter((v) => v !== undefined);
    if (values.length > 0) return values.reduce((sum, v) => sum + v, 0);
    return entries.length === 0 ? (asCount(result.usage?.[usageField]) ?? null) : null;
  };
  return {
    inputTokens: total("inputTokens", "input_tokens") ?? 0,
    outputTokens: total("outputTokens", "output_tokens") ?? 0,
    cacheReadTokens: total("cacheReadInputTokens", "cache_read_input_tokens"),
    cacheWriteTokens: total("cacheCreationInputTokens", "cache_creation_input_tokens"),
  };
}

/**
 * Second real adapter of the Claude port: uses the user's subscription through the Agent SDK (ADR 0004).
 * Every call is a single turn with no tools, no filesystem settings and a scratch working directory, so Claude
 * sees only what the code sent (ADR 0002).
 */
export function createSubscriptionClaudeGateway({
  oauthToken,
  query = agentSdkQuery,
}: SubscriptionGatewayOptions): ClaudeGateway {
  /** The token alone authenticates: an API key in the environment would take precedence over it. */
  function environment(): Record<string, string | undefined> {
    const { ANTHROPIC_API_KEY: _key, ANTHROPIC_AUTH_TOKEN: _auth, ...rest } = process.env;
    return { ...rest, CLAUDE_CODE_OAUTH_TOKEN: oauthToken };
  }

  /** One call (single-turn without a schema). Returns the successful result message, or throws the typed error it failed with. */
  async function run(call: {
    system: string;
    message: string;
    model: string;
    schema?: z.ZodType;
  }): Promise<any> {
    const failure: Failure = { text: "" };
    try {
      const messages = query({
        prompt: call.message,
        options: {
          model: call.model,
          systemPrompt: call.system,
          // Structured output is delivered through a synthetic tool call, which needs a turn beyond the answer itself.
          maxTurns: call.schema ? 5 : 1,
          tools: [],
          settingSources: [],
          persistSession: false,
          permissionMode: "dontAsk",
          cwd: tmpdir(),
          env: environment(),
          ...(call.schema
            ? { outputFormat: { type: "json_schema", schema: outputSchema(call.schema) } }
            : {}),
        },
      });

      for await (const message of messages as AsyncIterable<any>) {
        if (message.type === "rate_limit_event" && message.rate_limit_info?.status === "rejected") {
          failure.resetsAt = message.rate_limit_info.resetsAt;
        } else if (message.type === "assistant" && message.error) {
          failure.assistantError = message.error;
        } else if (message.type === "result") {
          if (message.is_error || message.subtype !== "success") {
            failure.apiStatus = message.api_error_status;
            failure.text = message.result ?? message.errors?.join("; ") ?? "";
            throw toTypedError(failure);
          }
          return message;
        }
      }
      throw toTypedError({ ...failure, text: "the SDK ended without a result" });
    } catch (error) {
      if (isNetworkFailure(error)) throw new ClaudeNetworkError(error);
      throw error;
    }
  }

  async function ask<T>(stage: { system: string; schema: z.ZodType<T>; message: string; model: string }): Promise<StageResult<T>> {
    const result = await run(stage);
    if (result.structured_output === undefined) throw new Error("Claude returned no structured output");
    return { output: stage.schema.parse(result.structured_output), model: stage.model, usage: toUsage(result) };
  }

  return {
    async checkAccess({ model }) {
      await run({ system: "Responda de forma curta.", message: "Responda apenas: ok", model });
    },

    extractTopics: ({ goal, model }) =>
      ask({ system: TOPIC_EXTRACTION_SYSTEM, schema: TopicsSchema, message: topicExtractionMessage(goal), model }),

    generateQuestions: ({ goal, topic, count, model }) =>
      ask({
        system: QUESTION_GENERATION_SYSTEM,
        schema: QuestionsSchema,
        message: questionGenerationMessage(goal, topic.name, count),
        model,
      }),

    resolveBlind: ({ questions, model }) =>
      ask({
        system: BLIND_RESOLUTION_SYSTEM,
        schema: BlindResolutionSchema,
        message: blindResolutionMessage(questions),
        model,
      }),
  };
}
