import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { ClaudeOverloadedError, type ClaudeGateway } from "../../application/ports/claude-gateway";
import { DEFAULT_MODEL, type Stage, type TokenUsage } from "../../domain/usage";

const TopicsSchema = z.object({ topics: z.array(z.string()) });

const QuestionsSchema = z.object({
  questions: z.array(
    z.object({
      prompt: z.string(),
      alternatives: z.array(z.object({ text: z.string(), explanation: z.string() })),
      correctIndex: z.number().int(),
    }),
  ),
});

const BlindResolutionSchema = z.object({ answers: z.array(z.number().int().nullable()) });

const BLIND_RESOLUTION_SYSTEM = `Você resolve Perguntas de múltipla escolha de forma independente.

Regras:
- Para cada Pergunta, escolha a Alternativa que você considera correta, com base no conhecimento atual e correto do assunto.
- "answers" tem um item por Pergunta, na mesma ordem do pedido: a posição (a partir de 0) da Alternativa escolhida.
- Use null só se nenhuma Alternativa for defensável ou se mais de uma for igualmente correta.`;

const TOPIC_EXTRACTION_SYSTEM = `Você ajuda alguém a estudar um assunto. Dado o Objetivo do estudo, proponha a lista de Tópicos em que o assunto se divide.

Regras:
- Entre 5 e 15 Tópicos, cada um uma subdivisão distinta do assunto, sem sobreposição.
- Cubra tudo o que o assunto cobra, não só o que o Objetivo menciona explicitamente.
- Nomes curtos (até 80 caracteres), em português, mantendo termos técnicos no original quando fizer sentido.`;

const QUESTION_GENERATION_SYSTEM = `Você escreve Perguntas de múltipla escolha para quem está estudando um assunto.

Regras:
- Escreva sempre em português, mantendo termos técnicos no original quando fizer sentido.
- Cada Pergunta tem de 4 a 5 Alternativas, exatamente uma correta, e uma só resposta defensável. Evite "todas as anteriores" e "nenhuma das anteriores".
- "correctIndex" é a posição (a partir de 0) da Alternativa correta. Varie essa posição entre as Perguntas.
- A "explanation" de cada Alternativa diz por que ela está certa ou por que está errada, de forma concreta.
- As Perguntas do pedido cobrem aspectos diferentes do Tópico e não repetem umas às outras.
- Use o conhecimento atual e correto do assunto. O Objetivo do estudo dá o foco e o nível de exigência.`;

function toUsage(usage: Anthropic.Usage): TokenUsage {
  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheReadTokens: usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: usage.cache_creation_input_tokens ?? 0,
  };
}

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

  /** Overload (529) is transient: surfaced as its own error so the queue retries. */
  async function guarded<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      if (error instanceof Anthropic.APIError && error.status === 529) throw new ClaudeOverloadedError();
      throw error;
    }
  }

  return {
    async extractTopics({ goal }) {
      const model = modelFor("topic-extraction");
      return guarded(async () => {
        const message = await client.messages.parse({
          model,
          max_tokens: 2048,
          system: TOPIC_EXTRACTION_SYSTEM,
          messages: [{ role: "user", content: `Objetivo do estudo:\n${goal}` }],
          output_config: { format: zodOutputFormat(TopicsSchema) },
        });
        if (!message.parsed_output) throw new Error("Claude returned no structured topics");
        return { output: message.parsed_output, model, usage: toUsage(message.usage) };
      });
    },

    async generateQuestions({ goal, topic, count }) {
      const model = modelFor("question-generation");
      return guarded(async () => {
        const message = await client.messages.parse({
          model,
          max_tokens: 16000,
          // The stable instructions come first and are marked cacheable, so calls within a Round reuse them.
          system: [{ type: "text", text: QUESTION_GENERATION_SYSTEM, cache_control: { type: "ephemeral" } }],
          messages: [
            {
              role: "user",
              content: `Objetivo do estudo:\n${goal}\n\nTópico: ${topic.name}\n\nEscreva ${count} ${count === 1 ? "Pergunta" : "Perguntas"} sobre este Tópico.`,
            },
          ],
          output_config: { format: zodOutputFormat(QuestionsSchema) },
        });
        if (!message.parsed_output) throw new Error("Claude returned no structured questions");
        return { output: message.parsed_output, model, usage: toUsage(message.usage) };
      });
    },

    async resolveBlind({ questions }) {
      const model = modelFor("blind-resolution");
      const text = questions
        .map((q, i) => `Pergunta ${i + 1}: ${q.prompt}\n${q.alternatives.map((a, j) => `  ${j}. ${a}`).join("\n")}`)
        .join("\n\n");
      return guarded(async () => {
        const message = await client.messages.parse({
          model,
          max_tokens: 4096,
          system: [{ type: "text", text: BLIND_RESOLUTION_SYSTEM, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: text }],
          output_config: { format: zodOutputFormat(BlindResolutionSchema) },
        });
        if (!message.parsed_output) throw new Error("Claude returned no structured resolution");
        return { output: message.parsed_output, model, usage: toUsage(message.usage) };
      });
    },
  };
}

/** Used when no API key is configured: every call fails with a clear message. */
export function createUnconfiguredClaudeGateway(): ClaudeGateway {
  const fail = async (): Promise<never> => {
    throw new Error("ANTHROPIC_API_KEY is not set. See .env.example.");
  };
  return { extractTopics: fail, generateQuestions: fail, resolveBlind: fail };
}
