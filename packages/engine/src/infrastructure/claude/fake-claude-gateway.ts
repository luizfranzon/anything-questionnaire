import {
  ClaudeOverloadedError,
  type ClaudeGateway,
  type ExtractTopicsRequest,
  type StageResult,
} from "../../application/ports/claude-gateway";
import { DEFAULT_MODEL, type TokenUsage } from "../../domain/usage";

export interface ScriptedTopics {
  topics: string[];
  model?: string;
  usage?: Partial<TokenUsage>;
}

/**
 * Fake gateway with responses scripted per Stage. Each `when...` call replaces the script; calls
 * consume it in order and the last entry repeats once the script runs out.
 */
export function createFakeClaudeGateway() {
  let script: Array<ScriptedTopics | Error> = [];
  const calls = { extractTopics: [] as ExtractTopicsRequest[] };

  const gateway: ClaudeGateway = {
    async extractTopics(request): Promise<StageResult<{ topics: string[] }>> {
      calls.extractTopics.push(request);
      if (script.length === 0) throw new Error("Fake Claude: no response scripted for topic extraction");
      const next = script.length > 1 ? script.shift()! : script[0];
      if (next instanceof Error) throw next;
      return {
        output: { topics: next.topics },
        model: next.model ?? DEFAULT_MODEL,
        usage: { inputTokens: 100, outputTokens: 20, cacheReadTokens: 0, cacheWriteTokens: 0, ...next.usage },
      };
    },
  };

  return {
    gateway,
    calls,
    whenExtractingTopics(...responses: Array<ScriptedTopics | Error>) {
      script = [...responses];
    },
    overloaded: () => new ClaudeOverloadedError(),
  };
}

export type FakeClaudeGateway = ReturnType<typeof createFakeClaudeGateway>;
