import {
  ClaudeOverloadedError,
  type ClaudeGateway,
  type ExtractTopicsRequest,
  type GenerateQuestionsRequest,
  type ResolveBlindRequest,
  type StageResult,
} from "../../application/ports/claude-gateway";
import type { GeneratedQuestion } from "../../domain/question";
import type { TokenUsage } from "../../domain/usage";

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

export interface ScriptedResolution {
  /** Positions in the batch that Claude gets wrong. Everything else is answered correctly. */
  wrongAt?: number[];
  model?: string;
  usage?: Partial<TokenUsage>;
}

type ResolutionScript = ScriptedResolution | Error;

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
  let resolutionScript: ResolutionScript[] = [];
  let serial = 0;
  /** What the fake wrote, by statement: lets it answer the blind resolution without being sent the Gabarito. */
  const truth = new Map<string, { alternatives: string[]; correctIndex: number }>();
  const calls = {
    extractTopics: [] as ExtractTopicsRequest[],
    generateQuestions: [] as GenerateQuestionsRequest[],
    resolveBlind: [] as ResolveBlindRequest[],
  };

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
        model: next.model ?? request.model,
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
      for (const q of next.questions) {
        if (q?.prompt && Array.isArray(q.alternatives)) {
          truth.set(q.prompt, { alternatives: q.alternatives.map((a) => a.text), correctIndex: q.correctIndex });
        }
      }
      return {
        output: { questions: next.questions },
        model: next.model ?? request.model,
        usage: { ...defaultUsage, ...next.usage },
      };
    },

    async resolveBlind(request): Promise<StageResult<{ answers: Array<number | null> }>> {
      calls.resolveBlind.push(request);
      const scripted = resolutionScript.length === 0 ? {} : nextOf(resolutionScript);
      if (scripted instanceof Error) throw scripted;
      const answers = request.questions.map((q, position) => {
        const known = truth.get(q.prompt);
        if (!known) return null;
        const correct = q.alternatives.indexOf(known.alternatives[known.correctIndex]);
        if (!scripted.wrongAt?.includes(position)) return correct;
        return (correct + 1) % q.alternatives.length;
      });
      return {
        output: { answers },
        model: scripted.model ?? request.model,
        usage: { ...defaultUsage, ...scripted.usage },
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
    whenResolvingBlind(...responses: ResolutionScript[]) {
      resolutionScript = [...responses];
    },
    overloaded: () => new ClaudeOverloadedError(),
  };
}

export type FakeClaudeGateway = ReturnType<typeof createFakeClaudeGateway>;
