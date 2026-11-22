import {
  ClaudeOverloadedError,
  type ClaudeGateway,
  type ExtractTopicsRequest,
  type GenerateQuestionsRequest,
  type StageResult,
} from "../../application/ports/claude-gateway";
import type { GeneratedQuestion } from "../../domain/question";
import { DEFAULT_MODEL, type TokenUsage } from "../../domain/usage";

export interface ScriptedTopics {
  topics: string[];
  model?: string;
  usage?: Partial<TokenUsage>;
}

export interface ScriptedQuestions {
  questions: GeneratedQuestion[];
  model?: string;
  usage?: Partial<TokenUsage>;
}

type QuestionScript = ScriptedQuestions | Error | ((request: GenerateQuestionsRequest) => ScriptedQuestions);

/** A well-formed question whose correct Alternative is the one at `correctIndex`. */
export function sampleQuestion(label: string, correctIndex = 0): GeneratedQuestion {
  return {
    prompt: `Pergunta sobre ${label}?`,
    alternatives: ["A", "B", "C", "D"].map((letter, i) => ({
      text: `${label}: opção ${letter}`,
      explanation: i === correctIndex ? `${label}: ${letter} está certa.` : `${label}: ${letter} está errada.`,
    })),
    correctIndex,
  };
}

const defaultUsage: TokenUsage = { inputTokens: 100, outputTokens: 20, cacheReadTokens: 0, cacheWriteTokens: 0 };

/**
 * Fake gateway with responses scripted per Stage. Each `when...` call replaces the script; calls
 * consume it in order and the last entry repeats once the script runs out. Question generation with
 * no script answers every request with the requested count of well-formed Questions.
 */
export function createFakeClaudeGateway() {
  let topicScript: Array<ScriptedTopics | Error> = [];
  let questionScript: QuestionScript[] = [];
  let serial = 0;
  const calls = { extractTopics: [] as ExtractTopicsRequest[], generateQuestions: [] as GenerateQuestionsRequest[] };

  function nextOf<T>(script: T[]): T {
    return script.length > 1 ? script.shift()! : script[0];
  }

  const gateway: ClaudeGateway = {
    async extractTopics(request): Promise<StageResult<{ topics: string[] }>> {
      calls.extractTopics.push(request);
      if (topicScript.length === 0) throw new Error("Fake Claude: no response scripted for topic extraction");
      const next = nextOf(topicScript);
      if (next instanceof Error) throw next;
      return {
        output: { topics: next.topics },
        model: next.model ?? DEFAULT_MODEL,
        usage: { ...defaultUsage, ...next.usage },
      };
    },

    async generateQuestions(request): Promise<StageResult<{ questions: GeneratedQuestion[] }>> {
      calls.generateQuestions.push(request);
      let next: ScriptedQuestions;
      if (questionScript.length === 0) {
        next = {
          questions: Array.from({ length: request.count }, () => sampleQuestion(`${request.topic.name} #${++serial}`)),
        };
      } else {
        const scripted = nextOf(questionScript);
        if (scripted instanceof Error) throw scripted;
        next = typeof scripted === "function" ? scripted(request) : scripted;
      }
      return {
        output: { questions: next.questions },
        model: next.model ?? DEFAULT_MODEL,
        usage: { ...defaultUsage, ...next.usage },
      };
    },
  };

  return {
    gateway,
    calls,
    whenExtractingTopics(...responses: Array<ScriptedTopics | Error>) {
      topicScript = [...responses];
    },
    whenGeneratingQuestions(...responses: QuestionScript[]) {
      questionScript = [...responses];
    },
    overloaded: () => new ClaudeOverloadedError(),
  };
}

export type FakeClaudeGateway = ReturnType<typeof createFakeClaudeGateway>;
