import {
  ClaudeCredentialError,
  ClaudeModelUnavailableError,
  ClaudeNetworkError,
  ClaudeUsageLimitError,
  type ClaudeGateway,
} from "../ports/claude-gateway";
import type { CredentialRepository, SecretCipher } from "../ports/credential-ports";
import {
  maskSecret,
  validateCredentialInput,
  type AccessMethod,
  type Credential,
  type CredentialSource,
  type CredentialStatus,
} from "../../domain/credential";
import { DomainError } from "../../domain/errors";

export interface CredentialEnvironment {
  ANTHROPIC_API_KEY?: string;
  CLAUDE_CODE_OAUTH_TOKEN?: string;
}

interface Deps {
  credentials: CredentialRepository;
  cipher: SecretCipher;
  env: CredentialEnvironment;
  /** Builds the real adapter for a Credential. Tests pass one that answers with the fake gateway. */
  gatewayFor: (credential: Credential) => ClaudeGateway;
  /** The model of the cheapest price, so the validation call costs as little as possible. */
  cheapestModel: () => Promise<string>;
}

/** The Credential in use and where it came from. The environment variable wins over the stored one. */
interface Active {
  credential: Credential;
  source: CredentialSource;
}

export function createCredentialUseCases({ credentials, cipher, env, gatewayFor, cheapestModel }: Deps) {
  function fromEnvironment(): Credential | null {
    // The API key wins when both are set, as it is the plain, billed-per-token path.
    if (env.ANTHROPIC_API_KEY?.trim()) return { method: "api-key", secret: env.ANTHROPIC_API_KEY.trim() };
    if (env.CLAUDE_CODE_OAUTH_TOKEN?.trim()) {
      return { method: "subscription", secret: env.CLAUDE_CODE_OAUTH_TOKEN.trim() };
    }
    return null;
  }

  async function active(): Promise<Active | null> {
    const fromEnv = fromEnvironment();
    if (fromEnv) return { credential: fromEnv, source: "environment" };
    const stored = await credentials.find();
    if (!stored) return null;
    try {
      return { credential: { method: stored.method, secret: cipher.decrypt(stored.secret) }, source: "stored" };
    } catch {
      // The master key is gone (the files volume was lost, say). Treat it as missing so the wizard opens and the user
      // can save a new one, instead of every screen failing with no way out.
      return null;
    }
  }

  async function status(): Promise<CredentialStatus> {
    const current = await active();
    if (!current) return { configured: false };
    return {
      configured: true,
      method: current.credential.method,
      masked: maskSecret(current.credential.secret),
      source: current.source,
    };
  }

  /** What went wrong in the validation call, in terms the wizard can tell the user. */
  function validationFailure(error: unknown): DomainError | unknown {
    if (error instanceof ClaudeCredentialError) return new DomainError("CREDENTIAL_INVALID");
    if (error instanceof ClaudeUsageLimitError) return new DomainError("CREDENTIAL_USAGE_LIMIT");
    if (error instanceof ClaudeModelUnavailableError) return new DomainError("CREDENTIAL_NO_MODEL_ACCESS");
    if (error instanceof ClaudeNetworkError) return new DomainError("CREDENTIAL_NETWORK");
    return error;
  }

  /** One adapter per Credential in use, rebuilt only when the Credential changes. */
  let cached: { key: string; gateway: ClaudeGateway } | undefined;
  function gatewayForActive(current: Credential): ClaudeGateway {
    const key = `${current.method}:${current.secret}`;
    if (cached?.key !== key) cached = { key, gateway: gatewayFor(current) };
    return cached.gateway;
  }

  /** The gateway the engine uses: each call goes through whichever Credential is in use at that moment. */
  const gateway: ClaudeGateway = (() => {
    const through =
      <K extends keyof ClaudeGateway>(operation: K): ClaudeGateway[K] =>
      (async (request: never) => {
        const current = await active();
        if (!current) throw new ClaudeCredentialError();
        return (gatewayForActive(current.credential)[operation] as (r: never) => unknown)(request);
      }) as ClaudeGateway[K];
    return {
      checkAccess: through("checkAccess"),
      extractTopics: through("extractTopics"),
      generateQuestions: through("generateQuestions"),
      resolveBlind: through("resolveBlind"),
    };
  })();

  return {
    gateway,

    getCredentialStatus: status,

    /** Throws when nothing could reach Claude yet, so work that needs Claude does not start and fail in the background. */
    async requireCredential(): Promise<void> {
      if (!(await active())) throw new DomainError("CREDENTIAL_REQUIRED");
    },

    /** Stores the Credential only after a minimal real call with it succeeds. The call is not recorded as usage. */
    async saveCredential(input: { method: AccessMethod; secret: string }): Promise<CredentialStatus> {
      const credential = validateCredentialInput(input);
      try {
        await gatewayFor(credential).checkAccess({ model: await cheapestModel() });
      } catch (error) {
        throw validationFailure(error);
      }
      await credentials.save({ method: credential.method, secret: cipher.encrypt(credential.secret) });
      return status();
    },
  };
}

export type CredentialUseCases = ReturnType<typeof createCredentialUseCases>;
