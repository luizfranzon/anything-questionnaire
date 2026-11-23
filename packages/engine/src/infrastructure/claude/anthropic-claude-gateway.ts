import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  ClaudeCredentialError,
  ClaudeNetworkError,
  ClaudeOverloadedError,
  ClaudeUsageLimitError,
  type ClaudeGateway,
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

function toUsage(usage: Anthropic.Usage): TokenUsage {
  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheReadTokens: usage.cache_read_input_tokens ?? null,
    cacheWriteTokens: usage.cache_creation_input_tokens ?? null,
  };
}

export interface AnthropicGatewayOptions {
  apiKey: string;
  /** Replaces the SDK client. Contract tests pass a simulated one. */
  client?: Pick<Anthropic, "messages">;
}

/** Turns what the Messages API throws into the errors every adapter shares. Unknown errors pass through. */
export function mapAnthropicError(error: unknown): unknown {
  if (error instanceof Anthropic.APIConnectionError) return new ClaudeNetworkError(error);
  if (!(error instanceof Anthropic.APIError)) return error;
  if (error.status === 529) return new ClaudeOverloadedError();
  if (error.status === 401 || error.status === 403) return new ClaudeCredentialError();
  if (error.status === 429) {
    const seconds = Number(error.headers?.get?.("retry-after"));
    return new ClaudeUsageLimitError(Number.isFinite(seconds) && seconds > 0 ? new Date(Date.now() + seconds * 1000) : undefined);
  }
  return error;
}

/** Real adapter: Messages API with structured output validated by schema (no forced tool use, no prefill). */
export function createAnthropicClaudeGateway({ apiKey, client = new Anthropic({ apiKey }) }: AnthropicGatewayOptions): ClaudeGateway {
  async function guarded<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      throw mapAnthropicError(error);
    }
  }

  return {
    async extractTopics({ goal, model }) {
      return guarded(async () => {
        const message = await client.messages.parse({
          model,
          max_tokens: 2048,
          system: TOPIC_EXTRACTION_SYSTEM,
          messages: [{ role: "user", content: topicExtractionMessage(goal) }],
          output_config: { format: zodOutputFormat(TopicsSchema) },
        });
        if (!message.parsed_output) throw new Error("Claude returned no structured topics");
        return { output: message.parsed_output, model, usage: toUsage(message.usage) };
      });
    },

    async generateQuestions({ goal, topic, count, model }) {
      return guarded(async () => {
        const message = await client.messages.parse({
          model,
          max_tokens: 16000,
          // The stable instructions come first and are marked cacheable, so calls within a Round reuse them.
          system: [{ type: "text", text: QUESTION_GENERATION_SYSTEM, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: questionGenerationMessage(goal, topic.name, count) }],
          output_config: { format: zodOutputFormat(QuestionsSchema) },
        });
        if (!message.parsed_output) throw new Error("Claude returned no structured questions");
        return { output: message.parsed_output, model, usage: toUsage(message.usage) };
      });
    },

    async resolveBlind({ questions, model }) {
      return guarded(async () => {
        const message = await client.messages.parse({
          model,
          max_tokens: 4096,
          system: [{ type: "text", text: BLIND_RESOLUTION_SYSTEM, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: blindResolutionMessage(questions) }],
          output_config: { format: zodOutputFormat(BlindResolutionSchema) },
        });
        if (!message.parsed_output) throw new Error("Claude returned no structured resolution");
        return { output: message.parsed_output, model, usage: toUsage(message.usage) };
      });
    },
  };
}

/** Used when no credential is configured: every call fails with a clear message. */
export function createUnconfiguredClaudeGateway(): ClaudeGateway {
  const fail = async (): Promise<never> => {
    throw new Error("No Claude credential is set. Set ANTHROPIC_API_KEY or CLAUDE_CODE_OAUTH_TOKEN. See .env.example.");
  };
  return { extractTopics: fail, generateQuestions: fail, resolveBlind: fail };
}
