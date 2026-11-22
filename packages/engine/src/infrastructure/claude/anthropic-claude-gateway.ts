import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { ClaudeOverloadedError, type ClaudeGateway } from "../../application/ports/claude-gateway";
import { DEFAULT_MODEL, type Stage } from "../../domain/usage";

const TopicsSchema = z.object({ topics: z.array(z.string()) });

const TOPIC_EXTRACTION_SYSTEM = `Você ajuda alguém a estudar um assunto. Dado o Objetivo do estudo, proponha a lista de Tópicos em que o assunto se divide.

Regras:
- Entre 5 e 15 Tópicos, cada um uma subdivisão distinta do assunto, sem sobreposição.
- Cubra tudo o que o assunto cobra, não só o que o Objetivo menciona explicitamente.
- Nomes curtos (até 80 caracteres), em português, mantendo termos técnicos no original quando fizer sentido.`;

export interface AnthropicGatewayOptions {
  apiKey: string;
  /** Model per Stage. Defaults to Opus 5.5 for all of them. */
  modelFor?: (stage: Stage) => string;
}

/** Real adapter: Messages API with structured output validated by schema (no forced tool use, no prefill). */
export function createAnthropicClaudeGateway({
  apiKey,
  modelFor = () => DEFAULT_MODEL,
}: AnthropicGatewayOptions): ClaudeGateway {
  const client = new Anthropic({ apiKey });

  return {
    async extractTopics({ goal }) {
      const model = modelFor("topic-extraction");
      try {
        const message = await client.messages.parse({
          model,
          max_tokens: 2048,
          system: TOPIC_EXTRACTION_SYSTEM,
          messages: [{ role: "user", content: `Objetivo do estudo:\n${goal}` }],
          output_config: { format: zodOutputFormat(TopicsSchema) },
        });
        if (!message.parsed_output) throw new Error("Claude returned no structured topics");
        return {
          output: message.parsed_output,
          model,
          usage: {
            inputTokens: message.usage.input_tokens,
            outputTokens: message.usage.output_tokens,
            cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
            cacheWriteTokens: message.usage.cache_creation_input_tokens ?? 0,
          },
        };
      } catch (error) {
        if (error instanceof Anthropic.APIError && error.status === 529) throw new ClaudeOverloadedError();
        throw error;
      }
    },
  };
}

/** Used when no API key is configured: every call fails with a clear message. */
export function createUnconfiguredClaudeGateway(): ClaudeGateway {
  return {
    async extractTopics() {
      throw new Error("ANTHROPIC_API_KEY is not set. See .env.example.");
    },
  };
}
